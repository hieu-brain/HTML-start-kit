'use strict'
// import _ from 'lodash'
// import testLog from './module'
//
// testLog()

//
// document.getElementById("nameSpan").innerHTML = person.getFirstName() + " " + person.getLastName();
// console.log(a)
import Person from "./module"

let person = new Person("Hieu", "Nguyen Ngoc")

document.getElementById("nameSpan").innerHTML = person.getFirstName() + " " + person.getLastName()

// let a = _.chunk(['a', 'b', 'c', 'd'], 2);
//
// console.log(a)

// import Vue from 'vue'
// import App from "./vue/Hello.vue"
//
// new Vue({
//   el: '#app',
//   render: function (createElement) {
//     return createElement(App)
//   }
// });

// var Vue = require('vue')
// var App = require('./vue/Hello.vue')
//
// new Vue({
//   el: '#app',
//   render: function (createElement) {
//     return createElement(App)
//   }
// })