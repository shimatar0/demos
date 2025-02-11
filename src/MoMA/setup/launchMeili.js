const { MeiliSearch } = require('meilisearch')
const dataset = require('./Artworks.json')
const { dataProcessing, batch, populateIndex, watchUpdates, addSettings } = require('./setup')
const isEqual = require('lodash/isEqual')
const sortBy = require('lodash/sortBy')

require('dotenv').config()

const INDEX = 'artWorks'
const BATCH_SIZE = 100000

const settings = {
  distinctAttribute: null,
  searchableAttributes: [
    'Artist',
    'Title',
    'ArtistBio',
    'Nationality',
    'Gender',
    'Date',
    'Medium',
    'Department',
    'MultipleArtists',
    'DateToSortBy'
  ],
  displayedAttributes: [
    'Title',
    'Artist',
    'ArtistBio',
    'Nationality',
    'Gender',
    'Date',
    'Medium',
    'Dimensions',
    'URL',
    'Department',
    'Classification',
    'ThumbnailURL',
    'MultipleArtists',
    'DateToSortBy'
  ],
  stopWords: ['a', 'an', 'the'],
  synonyms: {},
  filterableAttributes: [
    'Nationality', 'Gender', 'Classification'
  ],
  sortableAttributes: ['DateToSortBy'],
  rankingRules: [
    'typo',
    'words',
    'proximity',
    'attribute',
    'sort',
    'exactness'
  ]
}

;(async () => {
  // Create client
  const client = new MeiliSearch({
    host: process.env.VUE_APP_MEILISEARCH_HOST,
    apiKey: process.env.VUE_APP_MEILISEARCH_API_KEY
  })

  // Process documents
  const processedDataSet = dataProcessing(dataset)

  // Add documents batches array
  const batchedDataSet = batch(processedDataSet, BATCH_SIZE)

  // Create indexes
  await client.createIndex(INDEX, { primaryKey: 'ObjectID' })

  const currentSettings = await client.index(INDEX).getSettings()

  // Add new settings if they have changed
  if (!isEqual({ ...settings, filterableAttributes: sortBy(settings.filterableAttributes) }, { ...currentSettings, filterableAttributes: sortBy(currentSettings.filterableAttributes) })) {
    await addSettings(INDEX, settings, client)
  }

  const stats = await client.index(INDEX).getStats()
  // Add documents if index is empty
  if (stats.numberOfDocuments !== dataset.length) {
    await populateIndex(INDEX, batchedDataSet, client)
  }
  await watchUpdates(client, INDEX)
})()
