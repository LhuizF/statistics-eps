const http = require('http')
const url = require('url')
const jsonData = require('./data.json');

const { data, currentLastEp } = jsonData;

function getAvg() {
  const epForDay = data.reduce((acc, cur, index) => {
    const nextValue = data[index + 1]

    if (nextValue) {
      const total = nextValue.start - cur.start
      acc.push(total)
    }

    return acc
  }, [])

  const avg = epForDay.reduce((acc, cur) => acc + cur, 0) / epForDay.length

  return { avg: avg.toFixed(2) }
}

function prediction() {
  const { avg } = getAvg()
  const lastEpWatched = data[data.length - 1].start;

  const restDays = (currentLastEp - lastEpWatched) / Number(avg)

  return {
    restDays: restDays.toFixed(2)
  }
}

const routes = new Map([
  ['media', getAvg],
  ['previsao', prediction]
])


const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  const pathname = parsedUrl.pathname.replace('/', '')

  if (!routes.has(pathname)) {
    res.writeHead(404);

    res.end('BAD');
    return
  }

  const response = routes.get(pathname)()

  res.end(JSON.stringify(response))

});

const PORT = 3333;

server.listen(PORT, () => {
  console.log(`server run ${PORT}`);
});

