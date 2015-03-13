require('./hokko-fastopt.js')
window.MTFRP = {}
MTFRP.FRP = FRP()
MTFRP.VNode = require('vtree/vnode');
MTFRP.VText = require('vtree/vtext');
MTFRP.diff = require('vtree/diff');
MTFRP.patch = require('vdom/patch');
MTFRP.createElement = require('vdom/create-element');
