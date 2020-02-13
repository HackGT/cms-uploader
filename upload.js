var fetch = require('node-fetch')
var fs = require('fs')
var neatCsv = require('neat-csv')
require('dotenv').config()


var addEventMutation = `mutation AddEvent($createEvent: createEventbaseInput) {
  createEventbase(input: $createEvent) {
    eventbase {
      title
      start_time
      end_time
      id
    }
  }
}`

var areaMessage = `query {
  areas(start: 0) {
    name
    id
  }
}`

var variables = (data) => `{
  "createEvent": {
    "data": ${JSON.stringify(data)}
  }
}`

async function getAreas() {
    return fetch('https://cms.dev.hack.gt/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': `application/json`,
				'Accept' : `application/json`,
			},
			body: JSON.stringify({
				query: areaMessage,
			})
		}).then(r => {
			return r.json();
		})
}
async function getCMSData(query, data) {
	return fetch('https://cms.dev.hack.gt/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': `application/json`,
				'Accept' : `application/json`,
                'Authorization': `Bearer ${process.env.CMS_TOKEN}`
			},
			body: JSON.stringify({
				query: query,
                variables: variables(data)
			})
		}).then(r => {
            // console.log(r)
			return r.json();
		}).catch(err => {
            return false;
		});
}

async function addEvent(variables) {
    getCMSData(addEventMutation, variables).then(result => {
        console.log(result)
    });
}
async function uploadCsv(areas,filename) {
    let data = await fs.readFile(`./${filename}`, async (err, data) => {
      if (err) {
        console.error(err)
        return
      }
      neatCsv(data).then(async (data) => {
          data.forEach(async (eventbase) => {
              let title = eventbase['Event Name']
              let start_time = eventbase['Start Time (YYYY-MM-DD HH:MM:SS)']
              let end_time = eventbase['End Time (YYYY-MM-DD HH:MM:SS)']
              let description = eventbase['Description']
              let notification = eventbase['Notification Message']
              let area = areas[eventbase['Area']]
              let type = eventbase['Type']
              data_obj = {
                  title, start_time, end_time, notification, description, area, type
              }
              data_obj["public"] = true
              console.log(data_obj)
              await addEvent(data_obj)
          })
      }).catch(err => {
          conosole.log(err)
          return "Failure!"
      })
    });
}
getAreas().then(async areas => {
    listAreas = areas.data.areas
    areasDict = {}
    await listAreas.forEach(area => {
        areasDict[area["name"]] = area["id"]
    })
    uploadCsv(areasDict, 'data.csv').then(data => {
        console.log("data")
    })
});
