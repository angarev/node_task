const express = require('express');
const User = require('../db/models/user');
const auth = require('../middleware/auth');
const sharp = require('sharp');
const multer = require('multer');
const sendEmail = require('../emails');

const router = new express.Router();
//Post
router.post('/users', async (req, res) => {
	const user = new User(req.body);

	try {
		await user.save();
		const msg = `Welcome to app, ${user.name}. Let me know how you get along with the app.`;
		sendEmail(user.email, msg).catch(console.error);
		const token = await user.generateAuthToken();
		res.status(201).send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
});

router.post('/users/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();
		res.status(200).send({ user, token });
	} catch (error) {
		res.status(400).send(error);
	}
});

router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});

		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send(error);
	}
});

router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (error) {
		res.status(500).send(error);
	}
});

//Get
router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

//Update
router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowUpdates = ['name', 'email', 'password', 'age'];

	const isValidOperation = updates.every((update) =>
		allowUpdates.includes(update)
	);

	if (!isValidOperation) {
		res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		updates.forEach((update) => (req.user[update] = req.body[update]));
		await req.user.save();
		res.send(req.user);
	} catch (error) {
		res.status(500).send();
	}
});

//Delete
router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove();
		const msg = `Goodbye, ${req.user.name}. I hope to see you back soon.`;
		sendEmail(req.user.email, msg);
		res.send(req.user);
	} catch (error) {
		res.status(500).send();
	}
});

const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('File must be an image'));
		}
		cb(undefined, true);
	},
});

//Add avatar
router.post(
	'/users/me/avatar',
	auth,
	upload.single('avatar'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize(240, 240)
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.status(200).send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

//Delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
	try {
		req.user.avatar = undefined;
		await req.user.save();
		res.status(200).send();
	} catch (error) {
		res.status(500).send();
	}
});

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const _id = req.params.id;
		const user = await User.findById({ _id });
		if (!user || !user.avatar) {
			throw new Error();
		}
		res.set('Content-Type', 'image/png');
		res.send(user.avatar);
	} catch (error) {
		res.status(404).send();
	}
});

module.exports = router;
