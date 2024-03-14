const http = require('http')
const url = require('url')
const jsonData = require('./data.json');
const path = require('path');

const { data, currentLastEp } = jsonData;

const colors = [
  {
    main: '#1a80c4',
    secondary: '#06061a'
  },
  {
    main: '#dd04f2',
    secondary: '#120b2c'
  },
  {
    main: '#a06b62',
    secondary: '#020209'
  },
  {
    main: '#db753c',
    secondary: '#052365'
  },
  {
    main: '#99ec44',
    secondary: '#440b97'
  }
]

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

  const date = new Date()
  date.setDate(date.getDate() + restDays)

  return {
    restDays: restDays.toFixed(2),
    date: date.toISOString().split('T')[0].split('-').reverse().join('/')
  }
}

function page() {
  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  const avgForDay = getAvgByDay()
  const header = [['Dia', 'Episódios assistidos', 'Média por dia']]

  const dataFormatted = avgForDay.reduce((arr, { day, avg, epsWatched }) => {
    arr.push([day, epsWatched, Number(avg)])
    return arr
  }, header)

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">

    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
    <script type="text/javascript">
      google.charts.load('current', {'packages':['corechart']});
      google.charts.setOnLoadCallback(drawVisualization);

      function drawVisualization() {
        var data = google.visualization.arrayToDataTable(${JSON.stringify(dataFormatted)});

        var options = {
          title : 'Contagem de episódios',
          vAxis: {title: 'Número de episódios'},
          hAxis: {title: 'Dia'},
          seriesType: 'bars',
          series: {1: {type: 'line'}}
        };

        var chart = new google.visualization.ComboChart(document.getElementById('chart_div'));
        chart.draw(data, options)
      }
    </script>

    <title>Contagem de episódios</title>
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: ${randomColor.secondary};
        font-family: "Roboto", sans-serif;
        font-weight: 400;
        font-style: normal;
      }
      .container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        background-color: ${randomColor.secondary};
        padding: 20px;
        border-radius: 10px;
        font-size: 20px;
        color: ${randomColor.main};
        border: 2px solid ${randomColor.main};
        box-shadow: ${randomColor.main} 0px 4px 12px;
        width: 80%;
        max-width: 800px;
      }
      #chart_div {
        width: 100%;
        height: 40vw;
        max-height: 400px;
      }
    </style>
  </head>
  <body>
    <div class='container'>
      <h1>Contagem de episódios</h1>
      <p>Média de episódios por dia: ${getAvg().avg}</p>
      <p>Previsão para acabar: ${prediction().date}</p>
      <div id="chart_div"></div>
    </div>
  </body>
  </html>
  `

  return html
}

const getAvgByDay = () => {
  const avgForDay = data.reduce((acc, cur, index) => {
    const nextValue = data[index + 1]

    if (!nextValue) {
      return acc
    }

    const epsWatched = nextValue.start - cur.start

    const totalEps = acc.reduce((accInt, curInt) => curInt.epsWatched + accInt, 0) + epsWatched

    const avg = totalEps / (acc.length + 1)

    acc.push({ day: cur.date, epsWatched, avg: avg.toFixed(2) })

    return acc
  }, [])

  return avgForDay;
}

const routes = new Map([
  ['media', getAvg],
  ['previsao', prediction],
  ['', page],
  ['media-por-dia', getAvgByDay]
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

  res.end(typeof response === 'object' ? JSON.stringify(response) : response)

});

const PORT = 3333;

server.listen(PORT, () => {
  console.log(`server run ${PORT}`);
});

