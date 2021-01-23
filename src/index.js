const express = require('express');
require('../src/db/mongoose');
const app = express();

//Router
const userRouter = require('../src/routers/user');
const taskRouter = require('../src/routers/task');

//Mid
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Server start on port: ${port}`);
});
