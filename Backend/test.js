fetch('http://localhost:5000/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test Task from Node',
    description: 'Testing the backend',
    priority: 'high',
    status: 'pending',
    dueDate: '',
    category: 'Work'
  })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
