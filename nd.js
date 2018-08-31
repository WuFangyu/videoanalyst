const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const Multer = require('multer');

const server = express();


const loginRouter = express.Router();

const showRouter = express.Router();

var port = process.env.PORT || 9000;

server.listen(port);

server.use(Multer({dest:'./allfiles'}).any());
server.use('/login', loginRouter);
server.use('/show', showRouter);



showRouter.use('/showFiles', (req, res)=>{

    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'password',
        'database': 'mycloud'
    });

    Pool.getConnection((err, c)=>{

        if(err){
            console.log(err);
            res.send({'ok':0, 'msg': 'database failed'});
            c.end();
        }else{
            c.query('SELECT * FROM `allFiles`;', (err, data)=>{
                if(err){
                    console.log(err);
                    res.send({'ok':0, 'msg': 'database failed'});
                    c.end();
                }else{
                    res.send({'ok': 1, data:data});
                };
                c.end();
            })
        }

    })

});


showRouter.use('/addDownload', (req, res)=>{

    console.log(req.query.hash);

    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'password',
        'database': 'mycloud'
    });

    Pool.getConnection((err, c)=>{
        if(err){
            console.log(err);
            res.send({'ok':0, 'msg': 'database failed'});
        }else {
            c.query('SELECT download FROM `allFiles` WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";', (err, data)=>{

                console.log(data[0]);

                if(err){
                    console.log(err);
                    res.send({'ok':0, 'msg': 'database failed'});
                    c.end();
                }else{
                    var temp = Number(data[0].download)+1;
                    c.query('UPDATE `allFiles` SET download="'+temp+'" WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";', (err, data)=>{
                        if(err){
                            console.log(err);
                            res.send({'ok':0, 'msg': 'database failed'});
                            c.end();
                        }else{
                            c.query('UPDATE `'+req.query.user+'` SET download="'+temp+'" WHERE hashName="'+req.query.hash+'";', (err, data)=>{
                                if(err){
                                    console.log(err);
                                    res.send({'ok':0, 'msg': 'database failed'});
                                    c.end();
                                }else{
                                    res.send({'ok':1, 'msg': 'succeeded'});
                                }
                                c.end();
                            })
                        }
                    })
                }

            })

        }
    })

})


loginRouter.use('/getfiles', (req,res)=>{
    console.log(req.files);
    var newName = req.files[0].path + path.parse(req.files[0].originalname).ext;

    var hashName = req.files[0].filename + path.parse(req.files[0].originalname).ext;

    var thisTime = new Date().toLocaleDateString()+' '+new Date().toLocaleTimeString();

    fs.rename(req.files[0].path, newName, (err)=>{
        if(err){
            console.log(err);
        }else{
            var Pool = mysql.createPool({
                'host': 'localhost',
                'user': 'root',
                'password': 'password',
                'database': 'mycloud'
            });

            Pool.getConnection((err, c)=>{
                if(err){
                    console.log(err);
                    res.send({'ok':0, 'msg': 'database failed'});
                    c.end();
                }else{
                    c.query('INSERT INTO `'+ req.body.Fsnames+'` (`LastName`,`hashName`,`size`,`type`,`download`,`lastTime`) VALUES("'+req.files[0].originalname+'","'+hashName+'","'+req.files[0].size+'","'+path.parse(req.files[0].originalname).ext+'","0","'+thisTime+'");', (err, data)=>{
                        if (err) {
                            console.log(err);
                            res.send({'ok': 0, 'msg': 'failed!'});
                        } else {
                            console.log(req.body);
                            c.query('INSERT INTO `allFiles` (`LastName`,`hashName`,`size`,`type`,`download`,`lastTime`, `user`) VALUES("'+req.files[0].originalname+'","'+hashName+'","'+req.files[0].size+'","'+path.parse(req.files[0].originalname).ext+'","0","'+thisTime+'","'+req.body.Fsnames+'");', (err, data)=>{
                                if(err){
                                    console.log(err);
                                    res.send({'ok': 0, 'msg': 'failed!'});
                                }else{
                                    res.send({'ok': 1, 'msg': 'succeeded', hash:hashName, timer:thisTime});
                                }
                            })
                        }
                        c.end();
                    });
                };
            });
        }
    });
});



loginRouter.use('/res', (req,res)=>{
    //console.log(req.query);
    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'password',
        'database': 'mycloud'
    });

    Pool.getConnection((err, c)=>{
        if(err){
            console.log(err);
            res.send({'ok':0, 'msg': 'database failed'});
        }else{
            if(req.query.user == '' || req.query.pass == ''){
                console.log(err);
                res.send({'ok':0, 'msg': 'empty!'});
                return;
            }

            c.query('SELECT user FROM `usertable` WHERE user="' + req.query.user + '";', (err, data)=>{
                if(err){
                    console.log(err);
                    res.send({'ok':0, 'msg': 'database failed'});
                    c.end();
                }else{
                    if(data.length>0){
                        res.send({'ok':0, 'msg': 'userid has been taken'});
                        c.end();
                    }else{
                        c.query('INSERT INTO `usertable` (`user`, `password`) VALUES("'+req.query.user+'","'+
                            req.query.pass+'");', (err, data)=>{
                            if(err){
                                console.log(err);
                                res.send({'ok':0, 'msg': 'database failed'});
                                c.end();
                            }else{
                                c.query(`CREATE TABLE ${req.query.user}
                                ( 
                                ID int(255) NOT NULL AUTO_INCREMENT,
                                LastName varchar(255) NOT NULL,
                                hashName varchar(255) NOT NULL,
                                lastTime varchar(255) NOT NULL,
                                type varchar(255),
                                size varchar(255) NOT NULL,
                                download varchar(255) NOT NULL,
                                PRIMARY KEY(ID)
                                )`, (err, data)=>{
                                    if(err){
                                        console.log(err);
                                    }else{
                                        res.send({'ok':1, 'msg': 'succeeded'});
                                    };
                                    c.end();
                                })
                            }
                        })
                    }
                }
            });
        }
    });
});



loginRouter.use('/removeFile', (req, res)=>{

    console.log(req.query);

    fs.unlink('./allfiles/' + req.query.hash, (err)=>{

        if(err){
            console.log(err);
            res.send({'ok':0, 'msg': 'failed'});
        }else{
            var Pool = mysql.createPool({
                'host': 'localhost',
                'user': 'root',
                'password': 'password',
                'database': 'mycloud'
            });

            Pool.getConnection((err, c)=>{
                if(err){
                    console.log(err);
                    res.send({'ok':0, 'msg': 'failed'});
                   // c.end();
                }else{
                    c.query('DELETE FROM `'+req.query.user+'` WHERE hashName="'+req.query.hash+'";', (err, data)=>{
                        if(err){
                            console.log(err);
                            res.send({'ok':0, 'msg': 'failed'});
                        }else{
                            c.query('DELETE FROM `allFiles` WHERE hashName="'+req.query.hash+'"AND user="'+req.query.user+'";', (err, data)=>{

                                if(err){
                                    console.log(err);
                                    res.send({'ok':0, 'msg': 'failed'});
                                }else{
                                    res.send({'ok':1, 'msg': 'succeeded'});
                                }
                                c.end();

                            })

                        };
                    })
                }
            })
        }

    })

});


loginRouter.use('/login', (req,res)=>{
    //console.log(req.query);
    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'password',
        'database': 'mycloud'
    });

    Pool.getConnection((err, c)=>{
        if(err){
            console.log(err);
            res.send({'ok':0, 'msg': 'database failed'});
        }else{
            c.query('SELECT user FROM `usertable` WHERE user="' + req.query.user + '"AND password="'
                +req.query.pass+'";', (err, data)=>{
                if(err){
                    console.log(err);
                    res.send({'ok':0, 'msg': 'database failed'});
                    c.end();
                }else{
                    if(data.length>0){
                        c.query('SELECT LastName, hashName, size, lastTime, download FROM `'+req.query.user+'`;', (err, data)=>{
                            if(err){
                                console.log(err);
                                res.send({'ok':0, 'msg':'failed'});
                            }else{
                                res.send({'ok':1, 'msg':'succeeded', 'data': data});
                            }
                        })
                        c.end();
                    }else{
                        res.send({'ok':0, 'msg': 'failed'});
                        c.end();
                    }
                }
            });
        }
    });
});




server.use('/', express.static('./'))

