const { spawn } = require('child_process');
let fsPromises = require('fs/promises')
let fs = require('fs')
let polka = require('polka')
let cors = require('cors')
let bodyParser = require('body-parser');
const { resolve } = require('path/win32');
const { rejects } = require('assert/strict');



let g_nmap_result = false


g_app = polka()

g_app.use(cors())

g_app.use(bodyParser.json())


async function  get_net_stat_simplified() {
    return new Promise((resolve,reject) => {
        const netstat = spawn('netstat', ['-tn']);

        let gather_data = ""

        netstat.stdout.on('data', (data) => {
            gather_data += data.toString()
            console.log(`stdout: ${data}`);
        });
    
        netstat.stderr.on('data', (data) => {
            reject(data.toString())
            console.error(`stderr: ${data}`);
        });
    
        netstat.on('close', (code) => {
            resolve(gather_data)
            console.log(`child process exited with code ${code}`);
        });    
    })
}

async function  get_nmap_stat_simplified(addr_range) {
    return new Promise((resolve,reject) => {
        const nmap = spawn('nmap', ['-sP',addr_range]);

        let gather_data = ""

        nmap.stdout.on('data', (data) => {
            gather_data += data.toString()
            console.log(`stdout: ${data}`);
        });
    
        nmap.stderr.on('data', (data) => {
            reject(data.toString())
            console.error(`stderr: ${data}`);
        });
    
        nmap.on('close', (code) => {
            resolve(gather_data)
            console.log(`child process exited with code ${code}`);
        });    
    })
}



let confJSON = false

let config = "./admin-service.conf"
if ( process.argv[2] !== undefined ) {
    config = process.argv[2];
}


function init_all() {
    try {
        let data = fs.readFileSync(config,'ascii')
        data = data.toString()
console.log(data)
        confJSON = JSON.parse(data)
    } catch (e) {
        console.log(e)
    }
}
init_all()


g_app.get('/', async (req, res) => {
    try {
        let html = await fsPromises.readFile('index.html');
        console.log(html)
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);    
    } catch (e) {
        res.end('system check')
    }
});


let g_one_user_token = false

function gen_token() {
    let b = Math.floor(Math.random()*75727177121) + Math.round(75727177121/Math.floor(Math.random()*7))
    b += Date.now()
    return ('xes'+ b)
}


g_app.post('login', async (req, res) => {
    let {email,password} = req.body
    let mime_type = "application/json"
    g_one_user_token = gen_token()
    let [code,header,data] = [200,{ 'Content-Type': mime_type },JSON.stringify({ "status" : "OK", "token" : g_one_user_token })]
    if ( email && password ) {
    console.log(email)
    console.log(password)
        if ( ( confJSON.email === email ) && ( confJSON.password === password ) ) {
            res.writeHead(code,header);
            res.end(data);
            return    
        }
    }
    res.writeHead(404,header);
    res.end(JSON.stringify({ "status" : "ERR" }));
});

g_app.get('/ips/:token', async (req, res) => {
    let params = req.params
    if ( params.token === g_one_user_token ) {

        let data = await get_net_stat_simplified()
        data = data.split('\n')

        data = data.filter(line => {
            line = line.trim()
            if ( line.indexOf("tcp") === 0 ) {
                return true
            }
            return false
        })

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ "status" : "OK", "data" : data, "requested" : "ips" }));
        return; 
    }
    let header = { 'Content-Type': 'application/json' }
    res.writeHead(404,header);
    res.end(JSON.stringify({ "status" : "ERR" }));
})


g_app.get('/lan-ips/:token', async (req, res) => {
    let params = req.params
    if ( params.token === g_one_user_token ) {
        let data = []
        try {
            if ( g_nmap_result  !== false ) {
                data = g_nmap_result
            } else {
                data = await get_nmap_stat_simplified('192.168.1.0/24')
            }
            data = data.split('\n')
            data = data.filter((line) => {
                if ( line.indexOf('(192.') > 0 ) {
                    return true
                }
                return false
            })    
        } catch (e) {
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ "status" : "OK", "data" : data, "requested" : "ips" }));
        return; 
    }
    let header = { 'Content-Type': 'application/json' }
    res.writeHead(404,header);
    res.end(JSON.stringify({ "status" : "ERR" }));
})

//lan-ips


g_app.get('/logout/:token', async (req, res) => {
    let params = req.params
    if ( params.token === g_one_user_token ) {
        g_one_user_token = false
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ "status" : "OK", "data" : "data", "requested" : "logout" }));
        return;
    }
    let header = { 'Content-Type': 'application/json' }
    res.writeHead(404,header);
    res.end(JSON.stringify({ "status" : "ERR" }));
})

console.dir(confJSON)


async function ready() {
    g_nmap_result = await get_nmap_stat_simplified('192.168.1.0/24')
    g_app.listen(confJSON.port,() => {
        console.log(`listening on ${confJSON.port}`)
    });
}


ready()

