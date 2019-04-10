const http = require('http');
const fs = require('fs');
const qs = require('querystring');
const vars = require('./variables_ru');

const hostname = '0.0.0.0';
const port = 3000;

const indexPage = build('index.html', vars.index_page_injectors);
const commPage = build('comment.html', vars.comm_page_injectors);

const server = http.createServer((req, res) => {
    if (req.url == "/comment.html") {
        if (req.method == 'POST') {
            let body = '';

            req.on('data', function (data) {
                body += data;

                // Too much POST data, kill the connection!
                // 1e5 === 1 * Math.pow(10, 5) === 1 * 100000 ~~~ 100KB
                if (body.length > 1e5) {
                    console.log('Text is too big. Probably it\'s attempt to DDoS');
                    req.connection.destroy();
                }
            });
            req.on('end', function () {
                // Get our parsed data
                let post = qs.parse(body);
                let timestamp = (new Date()).toJSON().slice(0, 19);
                // console.log(post);
                // Write to db
                //id timestamp ip good bad
                fs.appendFile('./comments.txt',
                    '{ "time":"' + timestamp +
                    '", "ip": "' + req.connection.remoteAddress +
                    '", "good": "' + post.good.replace(/\n/g, ' ') +
                    '", "bad": "' + post.bad.replace(/\n/g, ' ') + '"}\n', function (err) {
                        if (err) { console.log(err); }
                    })
            });
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write(new Buffer(commPage, 'utf8'));
        res.end();
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write(new Buffer(indexPage, 'utf8'));
        res.end();
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function build(filename, injectors) {
    let data = fs.readFileSync(filename, 'utf8');
    let injectorKeys = Object.keys(injectors);
    injectorKeys.forEach(element => {
        let expression = new RegExp('\\$' + element, 'g');
        data = data.replace(expression, injectors[element]);
    });
    return data;
}