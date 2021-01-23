const express = require('express');
const Task = require('../db/models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

//Post
router.post('/tasks', auth, async (req, res) => {
	const task = new Task({ ...req.body, owner: req.user._id });
	try {
		await task.save();
		res.status(201).send(task);
	} catch (error) {
		res.status(400).send(error);
	}
});

//Get
router.get('/tasks', auth, async (req, res) => {
	let sort = {};

	if (req.query.sortBy) {
		let parts = req.query.sortBy.split(':');
		sort[parts[0]] = parts[1];
	}

	try {
		const task = await Task.find({
			owner: req.user._id,
			...(req.query.completed && { completed: req.query.completed }),
		})
			.sort(sort)
			.skip(parseInt(req.query.skip) || 0)
			.limit(parseInt(req.query.limit) || 0);
		res.send(task);
	} catch (error) {
		res.status(500).send();
	}
});

router.get('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id;
	try {
		const task = await Task.findOne({ _id, owner: req.user._id });

		if (!task) return res.status(404).send();
		res.send(user);
	} catch (error) {
		res.status(500).send();
	}
});

//Update
router.patch('/tasks/:id', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowUpdates = ['description', 'completed'];

	const isValidOperation = updates.every((update) =>
		allowUpdates.includes(update)
	);

	if (!isValidOperation) {
		res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		const task = await Task.findOne({
			_id: req.params.id,
			owner: req.user._id,
		});
		if (!task) return res.status(404).send();

		updates.forEach((update) => (task[update] = req.body[update]));

		await task.save();
		res.send(task);
	} catch (error) {
		res.status(500).send();
	}
});

//Delete
router.delete('/tasks/:id', auth, async (req, res) => {
	try {
		const task = await Task.findOneAndDelete({
			_id: req.params.id,
			owner: req.user._id,
		});
		if (!task) return res.status(404).send();
		res.send(task);
	} catch (error) {
		res.status(500).send();
	}
});

module.exports = router;
