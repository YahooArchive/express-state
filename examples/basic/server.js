var express = require('express'),
    exphbs  = require('express3-handlebars'),
    state   = require('../../'), // "express-state"

    app = express();

// Extend Express app with Express State's functionality. This adds the
// `app.expose()` and `res.expose()` methods.
state.extend(app);

app.engine('hbs', exphbs());
app.set('view engine', 'hbs');

app.expose({
    flickr_api: 'asdf'
});

app.get('/', function (req, res, next) {
    res.expose({
        user      : {id: '1234'},
        flickr_api: 'fdsa'
    });

    res.expose('Eric', 'user.name');

    res.render('index');
});

app.get('/foo', function (req, res, next) {
    res.expose({
        user: {id: '1234'}
    });

    res.render('index');
});

app.expose('MY APP', 'title');

app.listen(3000);
