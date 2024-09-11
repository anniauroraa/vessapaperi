// This will allow us to use process.env.MONGO_URI in our scripts
require('dotenv').config({path: './.env'})

const express = require('express')
const app = express()

const Entry = require('./models/entry')

// this first
app.use(express.static('dist'))

const cors = require('cors')
app.use(cors())

// this second
app.use(express.json())

// This is a request logger middleware
const morgan = require('morgan')
app.use(morgan('tiny'))

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 
  else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

let persons = [
]

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/stats', (request, response) => {
  Entry.find({}).then(entries => {
    response.json(entries) 
  })
})

app.get('/api/stats/:id', (request, response, next) => {
  const id = request.params.id
    Entry.findById(id)
      .then(entry => {
        if (entry) {
          console.log(entry.id, typeof entry.id, id, typeof id, entry.id === id)
          response.json(entry)
        } else {
          response.status(404).end()
        } 
      })
      .catch(error => next(error))
})

app.get('/info', (request, response) => {
    Entry.find({}).then(entries => {
      response.send(`<p>Stats has info for ${entries.length} entries</p><p>${new Date()}</p>`)
    })
})

app.delete('/api/stats/:id', (request, response, next) => {
  Entry.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/stats', (request, response) => {
  const body = request.body

  if (!body.object || !body.count) {
    return response.status(400).json({ 
      error: 'name or number missing' 
    })
  }

  const entry = new Entry({
    object: body.object,
    count: body.count
  })

  entry.save()
    .then(savedEntry => {
      response.json(savedEntry)
    })
    .catch(error => next(error))
})

app.put('/api/stats/:id', (request, response, next) => {
  const { object, count } = request.body
  const { id } = request.params

  const entryCount = Entry.findById(id)
    .then(entry => {
      console.log("new count to be added == " + count)

      // Ensure count is provided and is a number
      if (!count || isNaN(count)) {
        return response.status(400).json({ error: 'Invalid or missing count' });
      }

      const updatedCount = Number(entry.count) + Number(count)
      console.log("updated count == " + updatedCount)

      const newEntry = {
        object: entry.object,
        count: updatedCount
      }

      Entry.findByIdAndUpdate(
        id,
        newEntry,
        { new: true, runValidators: true }
      )
      .then(updatedEntry => {
        response.json(updatedEntry)
        console.log("updated number to ", updatedEntry)
      })
      .catch(error => next(error))
  
      
  })
})

  // response.set('Content-Type', 'application/json')
  
  // unknownEndpoint must be second to last middleware
  app.use(unknownEndpoint)
  
  // this has to be the last loaded middleware, also all the routes should be registered before this!
  app.use(errorHandler)

  const PORT = process.env.PORT
  app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
