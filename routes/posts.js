var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');

router.get('/show/:id', function(req, res, next) {
	var posts = db.get('posts');
	posts.findById(req.params.id, function(err, post) {
		res.render('show', {
			'post': post
		});
	});
});

router.get('/add', function(req, res, next) {
	var categories = db.get('categories');
	categories.find({}, {}, function(err, categories) {
		res.render('addpost', {
			'title': 'Add post',
			'categories': categories
		});
	});
});

router.post('/add', function(req, res, next) {
	// Get form values
	var title = req.body.title;
	var category = req.body.category;
	var body = req.body.body;
	var author = req.body.author;
	var date = new Date();
	
	// if (req.file.mainimage) {	// just req.file NOT req.file.mainimage
	if (req.file) {
		var mainimageOriginalName = req.file.mainimage.originalname;
		var mainimageName = req.file.mainimage.name;
		var mainimageMime = req.file.mainimage.mimetype;
		var mainimagePath = req.file.mainimage.path;
		var mainimageExt = req.file.mainimage.extension;
		var mainimageSize = req.file.mainimage.size;
	} else {
		var mainimageName = 'noimage.png';
	}
	
	//Form validation
	req.checkBody('title', 'Title field id required').notEmpty();
	req.checkBody('body', 'Body field id required').notEmpty();
	
	// Check errors
	var errors = req.validationErrors();
	
	if (errors) {
		res.render('/addpost', {
			'errors': errors,
			'title': title,
			'body': body
		});
	} else {
		var posts = db.get('posts');
		
		// Sumbit to DB
		posts.insert({
			'title': title,
			'body': body,
			'category': category,
			'date': date,
			'author': author,
			'mainimage': mainimageName
		}, function(err, post) {
			if (err) {
				res.send('There was an issue submitting the post');
			} else {
				req.flash('success', 'Post sumbitted');
				res.location('/');
				res.redirect('/');
			}
		})
	}
	
});

router.post('/addcomment', function(req, res, next) {
	// Get form values
	var name = req.body.name;
	var email = req.body.email;
	var body = req.body.body;
	var postid = req.body.postid;
	var commentdate = new Date();
	
	//Form validation
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Email is not formatted correctly').isEmail();
	req.checkBody('body', 'Body field is required').notEmpty();
	
	// Check errors
	var errors = req.validationErrors();
	
	if (errors) {
		var posts = db.get('posts');
		posts.findById(postid, function(err, post) {
			res.render('/show', {
				'errors': errors,
				'post': post
			});
		});

	} else {
		var comment = { 'name': name, 'email': email, 'body': body, 'commentdate': commentdate };
		
		var posts = db.get('posts');

		posts.update({
				'_id': postid
			},
			{
				$push: {
					'comments': comment		// to push comment into 'comments' array
				}
			},
			function(err, doc) {
				if (err) {
					throw err;
				} else {
					req.flash('success', 'Comment added');
					res.location('/posts/show/' + postid);
					res.redirect('/posts/show/' + postid);
				}
			}
		);
	}
	
});

module.exports = router;