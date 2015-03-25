/*eslint-env node*/
"use strict";

var express = require("express");
var elasticsearch = require("elasticsearch");
var rp = require('request-promise');

//noinspection Eslint
var router = express.Router();

// create a client instance of elasticsearch
var client = new elasticsearch.Client({
    host: "localhost:9200"
    //log: "trace"
});

// TODO REMOVE THIS CODE DUPLICATION !!!
// small check to ensure the status of the elasticsearch cluster
client.cluster.health()
    .then(function(resp) {
        if (resp.status !== "green") {
            console.log("Please check unassigned_shards");
        } else {
            console.log("ElasticSearch: OK");
        }
    }, function (error) {
        console.trace(error.message);
    });


// returns a promise
var fillStatsTweets = function(hashtag) {
    return rp.post({
        uri: 'http://localhost:9200/_search',
        method: 'POST',
        json: {
            "query": {
                "bool": {
                    "must":[{
                        "term": {
                            "tweets.hashtags": hashtag
                        }
                    }],
                    "must_not": [],
                    "should": []
                }
            },
            "from": 0,
            "size": 10,
            "sort": [],
            "facets": {}
        }
    });
};

// returns a promise
var fillStatsSidomes = function() {
    return rp.post({
        uri: 'http://localhost:9200/sidomes/_search',
        method: 'POST',
        json: {}
    });
};

/* GET tweets listing. */
router.get("/", function(req, res) {

    var output = {};
    var promises = [];
    var hashtags = [
        //"javascript", "angularjs", "backbone", "scala", "browserify", "iojs", "java", "apple"
        "iot", "sido", "objetsconnectes", "sidoevent", "gmc", "innovationdating"
    ];
    hashtags.forEach(function(ht) {
        promises.push(fillStatsTweets(ht));
    });

    var sidomesStats = fillStatsSidomes();

    Promise.all(promises).then(function(results) {
        for (var i = 0; i < promises.length; ++i) {
            var total = results[i].hits.total;
            output[hashtags[i]] = total;
        }
        sidomesStats.then(function(sidomesStatsRes) {
            output['sidomesPerso'] = sidomesStatsRes.hits.total;
            output['sidomesTotal'] = sidomesStatsRes.hits.total + anonPersonCount;
            res.send(output);
        }).catch(function(err) {
            console.error(err);
            res.status(500);
            res.send({});
        });
    }).catch(function(err) {
        console.error(err);
        res.status(500);
        res.send({});
    });
});

module.exports = router;
