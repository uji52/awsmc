#! /usr/bin/env node

var co = require('co');
var fs = require('fs');

var aws = require('aws-sdk');
var sts = new aws.STS();
var request = require('request');
var exec = require('child_process').exec;

var CONSOLE = "https://ap-northeast-1.console.aws.amazon.com/console";
var LOGIN = "https://signin.aws.amazon.com/federation";
var ISS = "awsmc";

co(function*() {
  var config = yield getConfig();
  var role = yield getAssumeRole(config);
  var token = yield getToken(role.Credentials);
  var url = yield getRedirectUrl(token);
  open(url);
}).catch(function(err){
  console.log(err);
});

function getConfig() {
  return new Promise(function(resolve, reject){
    fs.readFile('./awsmc.json', 'utf8', function (err, config) {
      config = JSON.parse(config)
      config.Policy = JSON.stringify(config.Policy);
      resolve(config);
    });
  });
}

function getAssumeRole() {
  return new Promise(function(resolve, reject){
    var params = {
      RoleArn: 'arn:aws:iam::615244477426:role/AssumeRole52',
      RoleSessionName: 'uji52',
      DurationSeconds: 900,
      Policy: '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}'
    };
    sts.assumeRole(params, function(err, data) {
      if (err) {
        reject(new Error(err));
      } else {
        resolve(data);
      }
    });
  });
}

function getToken(cred) {
  return new Promise(function(resolve, reject){
    var session = {
      sessionId: cred.AccessKeyId,
      sessionKey: cred.SecretAccessKey,
      sessionToken: cred.SessionToken
    }
    requestUrl = LOGIN
      + "?Action=getSigninToken"
      + "&SessionType=json"
      + "&Session=" + encodeURIComponent(JSON.stringify(session));
    var options = {
      url: requestUrl,
      json: true
    };
    request.get(options, function (err, res, body) {
      if (err) {
        reject(new Error(err));
      } else {
        resolve(body.SigninToken);
      }
    })
  });
}

function getRedirectUrl(token) {
  return new Promise(function(resolve, reject){
    var redirectUrl = LOGIN
      + "?Action=login"
      + "&SigninToken=" + encodeURIComponent(token)
      + "&Issuer=" + encodeURIComponent(ISS)
      + "&Destination=" + encodeURIComponent(CONSOLE)
    resolve(redirectUrl);
  });
}

function open(url) {
  console.log(url);
  exec("open \"" + url + "\"", function (error, out, err) {
  });
}
