const statusElement = document.querySelector('#status')
const outputElement = document.querySelector('#output')
const buttons = document.querySelectorAll('button[data-path]')

// Shows the JSON neatly with indentation; anything else is shown as it is
function formatBody(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

async function callRoute(method, path) {
  statusElement.textContent = `Status: waiting for ${method} ${path} ...`
  outputElement.textContent = ''

  try {
    // Relative URL: the page and the API come from the same server
    const response = await fetch(path, { method })
    const text = await response.text()

    // A 403 or 404 is a normal answer of the server, not a crash: show it
    statusElement.textContent = `Status: ${response.status} ${response.statusText}`
    outputElement.textContent = formatBody(text)
  } catch (error) {
    // The request itself failed (for example the server is not running)
    statusElement.textContent = 'Status: request failed'
    outputElement.textContent = error.message
  }
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    callRoute(button.dataset.method, button.dataset.path)
  })
})
