// /server/utils/printer.js
import net from "net"

const TIMEOUT_MS = 5000

export const sendToPrinter = (ip, port, buffer) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    let didConnect = false

    socket.setTimeout(TIMEOUT_MS)

    socket.connect(port, ip, () => {
      didConnect = true
      socket.write(buffer, (err) => {
        if (err) return reject(err)
        socket.end()
      })
    })

    socket.on("close", () => {
      if (didConnect) resolve({ success: true, bytes: buffer.length })
    })

    socket.on("timeout", () => {
      socket.destroy()
      reject(new Error(`Printer at ${ip}:${port} timed out`))
    })

    socket.on("error", (err) => {
      reject(err)
    })
  })
}
