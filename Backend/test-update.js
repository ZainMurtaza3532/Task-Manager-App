fetch('http://localhost:5000/api/tasks/6a280805cd5a253a7229e25d', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Updated Task from Node',
    dueDate: ''
  })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
