const Koa = require('koa')
const koaStatic = require('koa-static')
const WebSocket = require('ws')

const app = new Koa()
app.use(koaStatic(__dirname + '/public'))

const server = app.listen(8080)

const websocketServer = new WebSocket.Server({ server })

const clients = new Set()

function broadcast(message) {
  for (const client of clients) {
    const { ws, address } = client
    ws.send(message, error => {
      if (error) {
        console.log(`[Broadcast] ${address} error: ${error.message}`)
        clients.delete(client)
        broadcast(`${address}下线了`)
      }
    })
  }
}
websocketServer.on('connection', (ws, request) => {
  const address = request.connection.remoteAddress + ':' + request.connection.remotePort
  const client = { ws, address }
  clients.add(client)
  broadcast(address + '连接了')
  ws.on('message', (message) => {
    broadcast(`${address}:${message}`)
  })
})