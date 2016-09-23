var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', ensureAuthenticated,function(req, res){
	BooksSQL = 'SELECT * FROM books'
	connection.query(BooksSQL, function(err, rows, fields) {
		 if(err){
	           console.log("Error Selecting : %s ",err );
		 }
		 console.log(req.session.passport.user.id);
	            res.render('index',{page_title:"Books",data:rows,crtuser:req.session.passport.user.id});
	         });
});

router.get('/addbook', ensureAuthenticated,function(req, res){
	  res.render('add_book',{page_title:"Add Book"});
});


router.post('/insertbook', ensureAuthenticated,function(req, res){
	data ={bname: req.body.bookname,isbncode:req.body.isbncode,catalogue:req.body.catalogue,ctuserid:req.session.passport.user.id}
	
console.log(data);

Books_insert_SQL = "INSERT INTO books set ? ";
		connection.query(Books_insert_SQL,data,function(err, rows, fields) {
			 if(err){
		           console.log("Error Selecting : %s ",err );
			 }
			 console.log(rows);
			 res.redirect('/');
		                           
		});
});

router.get('/editbook', ensureAuthenticated,function(req, res){
	console.log(req.query.id);
	var id = req.query.id;
	Books_edit_SQL = "SELECT * FROM books WHERE id = ?";
	connection.query(Books_edit_SQL,[id],function(err, rows, fields) {
		 if(err){
	           console.log("Error Selecting : %s ",err );
		 }
	            res.render('edit_book',{page_title:"Books",data:rows});
	         });
});


router.post('/updatebook', ensureAuthenticated,function(req, res){
	var id = req.body.id;
	data ={bname: req.body.bookname,isbncode:req.body.isbncode,catalogue:req.body.catalogue}
	Books_update_SQL = "UPDATE books set ? WHERE id = ? "
		connection.query(Books_update_SQL,[data,id],function(err, rows, fields) {
			 if(err){
		           console.log("Error Selecting : %s ",err );
			 }
			 console.log(rows);
			 res.redirect('/');
		});
});

router.get('/delete', ensureAuthenticated,function(req, res){
	var id = req.query.id;
	Books_edit_SQL = "DELETE FROM books  WHERE id = ?";
	connection.query(Books_edit_SQL,[id],function(err, rows, fields) {
		 if(err){
	           console.log("Error Selecting : %s ",err );
		 }
		 		res.redirect('/');
	         });
});


router.get('/search', ensureAuthenticated,function(req, res){
	var search_str = req.query.srch;
	Books_search_SQL = "SELECT * FROM books WHERE bname LIKE " + connection.escape('%'+search_str+'%') + "OR isbncode LIKE " + connection.escape('%'+search_str+'%');
	connection.query(Books_search_SQL, function(err, rows, fields) {
			 if(err){
		           console.log("Error Selecting : %s ",err );
			 }
			 	res.render('index',{page_title:"Books",data:rows});
		     });
});


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {    
		return next();
	} 
	res.redirect('/users/login')
}

module.exports = router;
