const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const server = express();


const loginRouter = express.Router();


var port = process.env.PORT || 9000;

server.listen(port);

server.use('/login', loginRouter);


loginRouter.use('/res', (req,res)=>{
    //console.log(req.query);
    var Pool = mysql.createPool({
        'host': 'us-cdbr-iron-east-01.cleardb.net',
        'user': 'beb0ce369366d7',
        'password': 'ff3e14a6',
        'database': 'heroku_326ec9a75511f55'
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
                                res.send({'ok':1, 'msg': 'succeeded'});
                                c.end();
                            }
                        })
                    }
                }
            });
        }
    });
});

loginRouter.use('/login', (req,res)=>{
    //console.log(req.query);
    var Pool = mysql.createPool({
        'host': 'us-cdbr-iron-east-01.cleardb.net',
        'user': 'beb0ce369366d7',
        'password': 'ff3e14a6',
        'database': 'heroku_326ec9a75511f55'
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
                        res.send({'ok':1, 'msg':'succeeded'});
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


server.use('/', express.static('./'));




