const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/db/models/user');

const userOneId = new mongoose.Types.ObjectId();

const userOne = {
	_id: userOneId,
	name: 'Mike',
	email: 'mike@example.com',
	password: 'pass9999',
	tokens: [
		{
			token: jwt.sign({ _id: userOneId }, process.env.JSW_SECRET),
		},
	],
};

beforeEach(async () => {
	await User.deleteMany();
	await new User(userOne).save();
});

test('Should signup a new user', async () => {
	const response = await request(app)
		.post('/users')
		.send({
			name: 'Andrew',
			email: 'example@example.com',
			password: 'pass9999',
		})
		.expect(201);

	//Assert that db change correctly
	const user = await User.findById(response.body.user._id);
	expect(user).not.toBeNull();

	//Assertions about the response
	expect(response.body.user.name).toBe('Andrew');
});

test('Should login existing user', async () => {
	await request(app)
		.post('/users/login')
		.send({
			email: userOne.email,
			password: userOne.password,
		})
		.expect(200);
});

test('Should login nonexisting user', async () => {
	await request(app)
		.post('/users/login')
		.send({
			email: 'Mike1',
			password: userOne.password,
		})
		.expect(400);
});

test('Should get profile from user', async () => {
	await request(app)
		.get('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
});

test('Should not get profile from user', async () => {
	await request(app)
		.get('users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(404);
});

test('Should delete account for user', async () => {
	await request(app)
		.delete('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
});

test('Should not delete account for user', async () => {
	await request(app).delete('/users/me').send().expect(401);
});

test('Should upload avatar image', async () => {
	await request(app)
		.post('/users/me/avatar')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.attach('avatar', 'tests/fixtures/test_image.jpg')
		.expect(200);

	const user = await User.findById(userOneId);
	expect({}).toEqual({});
});
