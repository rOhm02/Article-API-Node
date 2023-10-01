// HTTP Modul einbinden
var http = require('http');

//FileSystem Modul einbinden
var fs = require('fs');

// Express einbinden
var express = require('express');
// Express-App erzeugen
var app = express();

// Body-Parser für Requests einbinden
var bodyParser = require('body-parser');
// Parsen von Querystrings (application/x-www-form-urlencoded) aktivieren
app.use(bodyParser.urlencoded({ extended: true }));
// Parsen von JSON (application/json) aktivieren
app.use(bodyParser.json());

//Allow CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// HTTP Server erzeugen
var server = http.createServer(app);

// Server an Port binden
server.listen(3000);

// Get article data
var articles = [];
var filename = __dirname + '/articles.json';

try {
    var filedata = fs.readFileSync(filename);
    articles = JSON.parse(filedata);
    console.log(articles.length + ' Datensätze gelesen');
    console.log(articles);
} catch (err) {
    // Keine Datei vorhanden, nichts tun
    console.log('Keine Datensätze gelesen');
}

// ID for new objects
var nextID = getMaxId() + 1;

// Return all articles
app.get('/articles', function (req, res) {
    let filteredArticles = articles;
    const tag = req.query.tag;
    const query = req.query.query;

    if (tag) {
        filteredArticles = findArticlesByTag(filteredArticles, tag);
    }
    if (query) {
        filteredArticles = findArticlesBySearchQuery(filteredArticles, query);
    }

    res.contentType('application/json');
    res.status(200).send(JSON.stringify(filteredArticles));
});

// Return article with given ID
app.get('/articles/:id', function (req, res) {
    const id = req.params.id;
    const article = findArticleById(id);

    if (Object.keys(article).length !== 0) {
        res.contentType('application/json');
        res.status(200).send(JSON.stringify(article));
    } else {
        res.contentType('text/plain');
        res.status(404).send('ID existiert nicht');
    }
});

// Delete article with given ID
app.delete('/articles/:id', function (req, res) {
    const id = req.params.id;

    const articleIndex = findIndexById(id);
    if (articleIndex >= 0) {
        articles.splice(articleIndex, 1);
        updateFile();

        res.contentType('application/json');
        res.status(200).send({ msg: 'Erfolgreich gelöscht' });
    } else {
        res.contentType('text/plain');
        res.status(404).send('ID existiert nicht');
    }
});

// Update article with given ID
app.put('/articles/:id', function (req, res) {
    const id = req.params.id;
    const articleIndex = findIndexById(id);

    if (articleIndex >= 0) {
        articles[articleIndex] = req.body;
        updateFile();
        res.contentType('application/json');
        res.status(200).send(JSON.stringify(req.body));
    } else {
        res.contentType('text/plain');
        res.status(404).send('ID existiert nicht');
    }
});

// Create new article
app.post('/articles', function (req, res) {
    req.body.id = nextID;
    nextID++;
    articles.push(req.body);
    updateFile();

    res.contentType('application/json');
    res.status(200).send(JSON.stringify(req.body));
});

// Return map with all tags and their amount
app.get('/tags', function (req, res) {
    const tagMap = getTagMap();
    res.contentType('application/json');
    res.status(200).send(JSON.stringify(tagMap));
});

//Loop through all articles and return article with given ID. Else return empty object
function findArticleById(id) {
    for (let i = 0; i < articles.length; i++) {
        if (id == articles[i].id) {
            return articles[i];
        }
    }
    return {};
}

// Return array of articles that contain the tag
function findArticlesByTag(array, tag) {
    return array.filter(element => element.tags.includes(tag));
}

// Return array of articles that contain the search query
function findArticlesBySearchQuery(array, query) {
    // Speicher für das Ergebnis
    var articlesWithSearchstring = [];

    // case insensitive Suche
    var q = query.toLowerCase();

    // Alle Artikel der Map durchgehen
    for (var id in array) {
        // Ist der Suchstring enthalten?
        var article = array[id];
        if (article.ueberschrift.toLowerCase().includes(q)
            || article.autor.toLowerCase().includes(q)
            || article.anriss.toLowerCase().includes(q)
            || article.text.toLowerCase().includes(q)
            || article.tags.includes(q)) {

            // Artikel in das Ergebnis einfügen
            articlesWithSearchstring.push(article);
        }
    }

    return articlesWithSearchstring;
}

// Return index of article with given ID
function findIndexById(id) {
    for (var i = 0; i < articles.length; i++) {
        if (articles[i].id == id) {
            return i;
        }
    }
    return -1;
}

// Update article data in articles.json file
function updateFile() {
    fs.writeFileSync(filename, JSON.stringify(articles));
}

// Returns max ID in array
function getMaxId() {
    var max = 0;

    for (var a of articles) {
        if (a.id > max) {
            max = a.id;
        }
    }
    return parseInt(max);
}

function getTagMap() {
    let tagMap = {};
    for (let a of articles) {
        a.tags.forEach(tag => {
            if (!(tag in tagMap)) {
                tagMap[tag] = 1;
            } else {
                tagMap[tag]++;
            }
        });
    }
    return tagMap;
}