import * as fs from 'fs'
import * as readline from 'readline'
import * as path from 'path'

const fileName = process.argv[2]
const headerSize = parseInt(process.argv[3])
const chunkSize = parseInt(process.argv[4])

let chunkCount = 0

if (fileName == null || headerSize == null || chunkSize == null || isNaN(headerSize) || isNaN(chunkSize)) {
  console.error("ERR: Please define all the params:")
  console.error("\t- path to file")
  console.error("\t- header size in number of lines")
  console.error("\t- size of one chunk in number of lines")
  console.error(`EXAMPLE: ${process.argv[1]} /path/to/file 14 100000`)
  process.exit(9)
}

const readInterface = readline.createInterface({
    input: fs.createReadStream(fileName),
    output: process.stdout,
    terminal: false
});

const header = Array<string>()

let lineNum = 0
let currChunkSize=0
let writeStream: fs.WriteStream
readInterface
  .on('line', function(line) {
    if (lineNum < headerSize) {
      header.push(line)
    } else {
      switch (currChunkSize) {
        case chunkSize-1:
          writeStream.write(line + '\n')
          writeStream.close()
          currChunkSize = 0
          chunkCount++
          break
        case 0:
          console.log(`New chunk file: ${genOutFileName()}`)
          writeStream = genWriteStream()
          header.forEach(hl => writeStream.write(`${hl}\n`))
          writeStream.write(line + '\n')
          currChunkSize++
          break
        default:
          writeStream.write(line + '\n')
          currChunkSize++
      }
    }
    lineNum++
  })
  .on('close', () => {
    if (typeof writeStream != 'undefined') {
      writeStream.close()
    }
  })


function genOutFileName() {
  const pp = path.parse(fileName)
  return `${pp.dir}/${pp.name}_${chunkCount}${pp.ext}`
}

function genWriteStream() {
  return fs.createWriteStream(genOutFileName(), {encoding: 'utf8'})
}