var Sequelize = require('sequelize');
var https = require('https');

var sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: 'items.db',
    logging: false,
});

sequelize
    .authenticate()
    .then(function(err) {
        console.log('Connection has been established successfully.');
    })
    .catch(function(err) {
        console.log('Unable to connect to the database:', err);
    });

var Item = sequelize.define('item', {
    name: {
        type: Sequelize.STRING
    }
}, {
    timestamps: false,
    freezeTableName: true
});

Item.sync().then(function() {
    console.log('Table created');
    DownloadItemsByPage(0);
});

function DownloadItemsByPage(pageId) {
    console.log('Getting page ' + pageId);
    https.get(`https://api.guildwars2.com/v2/items?page_size=200&page=${pageId}`, (res) => {
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {
            var itemList = JSON.parse(body);
            itemList.forEach(function(item) {
                console.log(item.id + '\t' + item.name);
                Item.create(item);
            });
            pageId++;
            if (res.headers['x-page-total'] && pageId < res.headers['x-page-total']) {
                DownloadItemsByPage(pageId);
            }
        });
        res.resume();
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });
}
