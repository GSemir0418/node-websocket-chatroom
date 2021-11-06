const Koa = require('koa')
// koa没有内置静态资源的中间件，因此使用koa-static
const koaStatic = require('koa-static')
const WebSocket = require('ws')

const app = new Koa()
app.use(koaStatic(__dirname + '/public'))

const server = app.listen(8080)

// 将8080端口的server托管给websocket服务器
const websocketServer = new WebSocket.Server({ server })

// 利用Set集合存储全部客户端
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
  // connection事件触发后，将ws和用户地址端口作为客户端信息存储到clients中
  const address = request.connection.remoteAddress + ':' + request.connection.remotePort
  const client = { ws, address }
  clients.add(client)
  broadcast(address + '连接了')
  ws.on('message', (message) => {
    broadcast(`${address}:${message}`)
  })
})