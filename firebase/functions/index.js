'use strict';

function compareDates(d1, d2) { if (d1 < d2) { return -1; } else if (d1 > d2) { return 1; } return 0; }
function compareAgenda(e1, e2) { return compareDates(e1.from, e2.from); }
function mapAngendaDates(e) { e.from = new Date(e.from); e.to = new Date(e.to); return e; }

let agenda = require("./agenda.json").map(mapAngendaDates).sort(compareAgenda);


const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  function eventQuery(agent) {
    let time = request.body.queryResult.parameters.time || new Date();

    console.log(`Event Query executed: ${request.body.queryResult.queryText}, time: ${time}`);

    let event = agenda.find(function (e) { return e.from > time && e.to > time; });
    if (event) {
      console.log("Event: " + JSON.stringify(event));
      let timePart = `(${event.from.toISOString().substring(11, 16)} -  ${event.to.toISOString().substring(11, 16)})`
      let titlePart = typeof (event.presenter) != undefined ? `${event.title} by ${event.presenter}` : `${event.title}`;
      let response = `${titlePart} ${timePart}`;

      console.log("Dialog Flow Response Body: " + response);
      agent.add(response);
    } else {
      agent.add("Oops! Seems like no fun at that time.");
    }

  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Event Query', eventQuery);
  agent.handleRequest(intentMap);
});
