'use strict';

function compareDates(d1, d2) { if (d1 < d2) { return -1; } else if (d1 > d2) { return 1; } return 0; }
function compareAgenda(e1, e2) { return compareDates(e1.from, e2.from); }
function mapAngendaDates(e) { e.from = new Date(e.from); e.to = new Date(e.to); return e; }
function localTimeString(t) {
  return t.toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore' }).replace(":00 ", " ");
}
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
  function nextEventQuery(agent) {
    let event = agenda.find(function (e) { return e.from > new Date(); });
    sendEventDetails(agent, event);
  }

  function findEventByTime(agent) {
    let time = new Date(request.body.queryResult.parameters.time);
    let event = agenda.find(function (e) {
      let result = e.from <= time && time < e.to;
      console.log({ result, from: e.from, to: e.to, time });
      return result;
    });
    sendEventDetails(agent, event);
  }
  function listEvents(agent) {
    agenda.forEach(function (e) { sendEventDetails(agent, e) });
  }

  function sendEventDetails(agent, event) {
    if (event) {
      console.log("Event: " + JSON.stringify(event));

      let timePart = `(${localTimeString(event.from)} - ${localTimeString(event.to)})`;
      let titlePart = typeof (event.presenter) != "undefined" ? `${event.title} by ${event.presenter}` : `${event.title}`;
      let response = `${titlePart} ${timePart}`;

      console.log("Dialog Flow Response Body: " + response);
      agent.add(response);
    } else {
      console.log("No event found");
      agent.add("Oops! Seems like no fun at that time.");
    }

  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Next Event Query', nextEventQuery);
  intentMap.set('Find Event by Time', findEventByTime);
  intentMap.set("List Events", listEvents);
  agent.handleRequest(intentMap);
});

