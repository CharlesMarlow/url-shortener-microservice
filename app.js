const express = require('express');
const bodyParder = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const shortUrl = require('./models/shortUrl');

const app = express();
app.use(bodyParder.json());
app.use(cors());

const port = process.env.PORT || 3000;
const validUrlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

// Connect to Mongo
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/shortUrls');

// Send app to landing page UI
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/views/index.html`);
});

// Allow node to find static content
app.use(express.static(`${__dirname}/public`));

// Database entry
app.get('/new/:url(*)', (req, res) => {
    const { url } = req.params;

    if (validUrlRegex.test(url) === true){
        const short = Math.floor(Math.random() * 10000).toString();

        const data = new shortUrl({
            originalUrl: url,
            shorterUrl: short,
        });

        data.save(err => {
            if(err) {
                res.send('Error while saving to database...');
            }
        });
        // Return on success
        return res.json({
        data,
        });
    }

    // Return on failure
    const data = new shortUrl({
        originalUrl: 'Url to shorten does not match proper format',
        shorterUrl: 'Invalid url',
    });
    return res.json(data);
});

// Forward to original url by querying db
app.get('/:urlToForward', (req, res) => {
    const shorterUrl = req.params.urlToForward;

    shortUrl.findOne({ 'shorterUrl': shorterUrl }, (err, data) => {
        if(err) {
            return res.send('Error while reading the database')
        }

        const regex = new RegExp("^(http|https)://", "i");
        const strToCheck = data.originalUrl;

        if(regex.test(strToCheck)) {
            res.redirect(301, data.originalUrl);
        } else {
            res.redirect(301, `http://${data.originalUrl}`);
        }
    })

});

app.listen(port, () => {
    console.log(`App is listening on port ${3000}. This is great news!`);
});