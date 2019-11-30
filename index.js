//  Third party libraries
require('dotenv').config();
const packageJSON = require('./package');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const _ = require('lodash');

// Environment: development, staging, testing, production
const environment = process.env.NODE_ENV || 'development';
console.log(`App running in "${environment}" mode`);

//  --------------------------Server configurationn----------------------------------.
const port = process.env.PORT || 3001;

const app = express();

// allow cross origin requests, configure to only allow requests from certain origins
app.use(cors());

// secure express app
app.use(helmet({
    dnsPrefetchControl: false,
    frameguard: false,
    ieNoOpen: false,
}));

// parsing the request bodys
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


//  Controllers
const utils = require('./controllers/utils');

app.use('/', utils);

app.get("/", (req, res) => {
    res.send(_.pick(packageJSON, ['name', 'version', 'description']));
});

app.listen(port,
    () => {
        console.log(`Listening on port ${port}`)
    }
)

module.exports = app;
