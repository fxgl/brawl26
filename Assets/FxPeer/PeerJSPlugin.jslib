var LibraryUnityPeerJS = {
    $UnityPeerJS: {
        peers: [],
        peer_min_js: null
    },

    Init: function () {
    if (UnityPeerJS.peer_min_js != null)
        return;

    UnityPeerJS.peer_min_js =
/*! peerjs build:0.3.14, production. Copyright(c) 2013 Michelle Bu <michelle@michellebu.com> */!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b){b.exports.RTCSessionDescription=window.RTCSessionDescription||window.mozRTCSessionDescription,b.exports.RTCPeerConnection=window.RTCPeerConnection||window.mozRTCPeerConnection||window.webkitRTCPeerConnection,b.exports.RTCIceCandidate=window.RTCIceCandidate||window.mozRTCIceCandidate},{}],2:[function(a,b){function c(a,b,g){return this instanceof c?(e.call(this),this.options=d.extend({serialization:"binary",reliable:!1},g),this.open=!1,this.type="data",this.peer=a,this.provider=b,this.id=this.options.connectionId||c._idPrefix+d.randomToken(),this.label=this.options.label||this.id,this.metadata=this.options.metadata,this.serialization=this.options.serialization,this.reliable=this.options.reliable,this._buffer=[],this._buffering=!1,this.bufferSize=0,this._chunkedData={},this.options._payload&&(this._peerBrowser=this.options._payload.browser),void f.startConnection(this,this.options._payload||{originator:!0})):new c(a,b,g)}var d=a("./util"),e=a("eventemitter3"),f=a("./negotiator"),g=a("reliable");d.inherits(c,e),c._idPrefix="dc_",c.prototype.initialize=function(a){this._dc=this.dataChannel=a,this._configureDataChannel()},c.prototype._configureDataChannel=function(){var a=this;d.supports.sctp&&(this._dc.binaryType="arraybuffer"),this._dc.onopen=function(){d.log("Data channel connection success"),a.open=!0,a.emit("open")},!d.supports.sctp&&this.reliable&&(this._reliable=new g(this._dc,d.debug)),this._reliable?this._reliable.onmessage=function(b){a.emit("data",b)}:this._dc.onmessage=function(b){a._handleDataMessage(b)},this._dc.onclose=function(){d.log("DataChannel closed for:",a.peer),a.close()}},c.prototype._handleDataMessage=function(a){var b=this,c=a.data,e=c.constructor;if("binary"===this.serialization||"binary-utf8"===this.serialization){if(e===Blob)return void d.blobToArrayBuffer(c,function(a){c=d.unpack(a),b.emit("data",c)});if(e===ArrayBuffer)c=d.unpack(c);else if(e===String){var f=d.binaryStringToArrayBuffer(c);c=d.unpack(f)}}else"json"===this.serialization&&(c=JSON.parse(c));if(c.__peerData){var g=c.__peerData,h=this._chunkedData[g]||{data:[],count:0,total:c.total};return h.data[c.n]=c.data,h.count+=1,h.total===h.count&&(delete this._chunkedData[g],c=new Blob(h.data),this._handleDataMessage({data:c})),void(this._chunkedData[g]=h)}this.emit("data",c)},c.prototype.close=function(){this.open&&(this.open=!1,f.cleanup(this),this.emit("close"))},c.prototype.send=function(a,b){if(!this.open)return void this.emit("error",new Error("Connection is not open. You should listen for the `open` event before sending messages."));if(this._reliable)return void this._reliable.send(a);var c=this;if("json"===this.serialization)this._bufferedSend(JSON.stringify(a));else if("binary"===this.serialization||"binary-utf8"===this.serialization){var e=d.pack(a),f=d.chunkedBrowsers[this._peerBrowser]||d.chunkedBrowsers[d.browser];if(f&&!b&&e.size>d.chunkedMTU)return void this._sendChunks(e);d.supports.sctp?d.supports.binaryBlob?this._bufferedSend(e):d.blobToArrayBuffer(e,function(a){c._bufferedSend(a)}):d.blobToBinaryString(e,function(a){c._bufferedSend(a)})}else this._bufferedSend(a)},c.prototype._bufferedSend=function(a){(this._buffering||!this._trySend(a))&&(this._buffer.push(a),this.bufferSize=this._buffer.length)},c.prototype._trySend=function(a){try{this._dc.send(a)}catch(b){this._buffering=!0;var c=this;return setTimeout(function(){c._buffering=!1,c._tryBuffer()},100),!1}return!0},c.prototype._tryBuffer=function(){if(0!==this._buffer.length){var a=this._buffer[0];this._trySend(a)&&(this._buffer.shift(),this.bufferSize=this._buffer.length,this._tryBuffer())}},c.prototype._sendChunks=function(a){for(var b=d.chunk(a),c=0,e=b.length;e>c;c+=1){var a=b[c];this.send(a,!0)}},c.prototype.handleMessage=function(a){var b=a.payload;switch(a.type){case"ANSWER":this._peerBrowser=b.browser,f.handleSDP(a.type,this,b.sdp);break;case"CANDIDATE":f.handleCandidate(this,b.candidate);break;default:d.warn("Unrecognized message type:",a.type,"from peer:",this.peer)}},b.exports=c},{"./negotiator":5,"./util":8,eventemitter3:9,reliable:12}],3:[function(a){window.Socket=a("./socket"),window.MediaConnection=a("./mediaconnection"),window.DataConnection=a("./dataconnection"),window.Peer=a("./peer"),window.RTCPeerConnection=a("./adapter").RTCPeerConnection,window.RTCSessionDescription=a("./adapter").RTCSessionDescription,window.RTCIceCandidate=a("./adapter").RTCIceCandidate,window.Negotiator=a("./negotiator"),window.util=a("./util"),window.BinaryPack=a("js-binarypack")},{"./adapter":1,"./dataconnection":2,"./mediaconnection":4,"./negotiator":5,"./peer":6,"./socket":7,"./util":8,"js-binarypack":10}],4:[function(a,b){function c(a,b,g){return this instanceof c?(e.call(this),this.options=d.extend({},g),this.open=!1,this.type="media",this.peer=a,this.provider=b,this.metadata=this.options.metadata,this.localStream=this.options._stream,this.id=this.options.connectionId||c._idPrefix+d.randomToken(),void(this.localStream&&f.startConnection(this,{_stream:this.localStream,originator:!0}))):new c(a,b,g)}var d=a("./util"),e=a("eventemitter3"),f=a("./negotiator");d.inherits(c,e),c._idPrefix="mc_",c.prototype.addStream=function(a){d.log("Receiving stream",a),this.remoteStream=a,this.emit("stream",a)},c.prototype.handleMessage=function(a){var b=a.payload;switch(a.type){case"ANSWER":f.handleSDP(a.type,this,b.sdp),this.open=!0;break;case"CANDIDATE":f.handleCandidate(this,b.candidate);break;default:d.warn("Unrecognized message type:",a.type,"from peer:",this.peer)}},c.prototype.answer=function(a){if(this.localStream)return void d.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");this.options._payload._stream=a,this.localStream=a,f.startConnection(this,this.options._payload);for(var b=this.provider._getMessages(this.id),c=0,e=b.length;e>c;c+=1)this.handleMessage(b[c]);this.open=!0},c.prototype.close=function(){this.open&&(this.open=!1,f.cleanup(this),this.emit("close"))},b.exports=c},{"./negotiator":5,"./util":8,eventemitter3:9}],5:[function(a,b){var c=a("./util"),d=a("./adapter").RTCPeerConnection,e=a("./adapter").RTCSessionDescription,f=a("./adapter").RTCIceCandidate,g={pcs:{data:{},media:{}},queue:[]};g._idPrefix="pc_",g.startConnection=function(a,b){var d=g._getPeerConnection(a,b);if("media"===a.type&&b._stream&&d.addStream(b._stream),a.pc=a.peerConnection=d,b.originator){if("data"===a.type){var e={};c.supports.sctp||(e={reliable:b.reliable});var f=d.createDataChannel(a.label,e);a.initialize(f)}c.supports.onnegotiationneeded||g._makeOffer(a)}else g.handleSDP("OFFER",a,b.sdp)},g._getPeerConnection=function(a,b){g.pcs[a.type]||c.error(a.type+" is not a valid connection type. Maybe you overrode the `type` property somewhere."),g.pcs[a.type][a.peer]||(g.pcs[a.type][a.peer]={});{var d;g.pcs[a.type][a.peer]}return b.pc&&(d=g.pcs[a.type][a.peer][b.pc]),d&&"stable"===d.signalingState||(d=g._startPeerConnection(a)),d},g._startPeerConnection=function(a){c.log("Creating RTCPeerConnection.");var b=g._idPrefix+c.randomToken(),e={};"data"!==a.type||c.supports.sctp?"media"===a.type&&(e={optional:[{DtlsSrtpKeyAgreement:!0}]}):e={optional:[{RtpDataChannels:!0}]};var f=new d(a.provider.options.config,e);return g.pcs[a.type][a.peer][b]=f,g._setupListeners(a,f,b),f},g._setupListeners=function(a,b){var d=a.peer,e=a.id,f=a.provider;c.log("Listening for ICE candidates."),b.onicecandidate=function(b){b.candidate&&(c.log("Received ICE candidates for:",a.peer),f.socket.send({type:"CANDIDATE",payload:{candidate:b.candidate,type:a.type,connectionId:a.id},dst:d}))},b.oniceconnectionstatechange=function(){switch(b.iceConnectionState){case"disconnected":case"failed":c.log("iceConnectionState is disconnected, closing connections to "+d),a.close();break;case"completed":b.onicecandidate=c.noop}},b.onicechange=b.oniceconnectionstatechange,c.log("Listening for `negotiationneeded`"),b.onnegotiationneeded=function(){c.log("`negotiationneeded` triggered"),"stable"==b.signalingState?g._makeOffer(a):c.log("onnegotiationneeded triggered when not stable. Is another connection being established?")},c.log("Listening for data channel"),b.ondatachannel=function(a){c.log("Received data channel");var b=a.channel,g=f.getConnection(d,e);g.initialize(b)},c.log("Listening for remote stream"),b.onaddstream=function(a){c.log("Received remote stream");var b=a.stream,g=f.getConnection(d,e);"media"===g.type&&g.addStream(b)}},g.cleanup=function(a){c.log("Cleaning up PeerConnection to "+a.peer);var b=a.pc;!b||"closed"===b.readyState&&"closed"===b.signalingState||(b.close(),a.pc=null)},g._makeOffer=function(a){var b=a.pc;b.createOffer(function(d){c.log("Created offer."),!c.supports.sctp&&"data"===a.type&&a.reliable&&(d.sdp=Reliable.higherBandwidthSDP(d.sdp)),b.setLocalDescription(d,function(){c.log("Set localDescription: offer","for:",a.peer),a.provider.socket.send({type:"OFFER",payload:{sdp:d,type:a.type,label:a.label,connectionId:a.id,reliable:a.reliable,serialization:a.serialization,metadata:a.metadata,browser:c.browser},dst:a.peer})},function(b){a.provider.emitError("webrtc",b),c.log("Failed to setLocalDescription, ",b)})},function(b){a.provider.emitError("webrtc",b),c.log("Failed to createOffer, ",b)},a.options.constraints)},g._makeAnswer=function(a){var b=a.pc;b.createAnswer(function(d){c.log("Created answer."),!c.supports.sctp&&"data"===a.type&&a.reliable&&(d.sdp=Reliable.higherBandwidthSDP(d.sdp)),b.setLocalDescription(d,function(){c.log("Set localDescription: answer","for:",a.peer),a.provider.socket.send({type:"ANSWER",payload:{sdp:d,type:a.type,connectionId:a.id,browser:c.browser},dst:a.peer})},function(b){a.provider.emitError("webrtc",b),c.log("Failed to setLocalDescription, ",b)})},function(b){a.provider.emitError("webrtc",b),c.log("Failed to create answer, ",b)})},g.handleSDP=function(a,b,d){d=new e(d);var f=b.pc;c.log("Setting remote description",d),f.setRemoteDescription(d,function(){c.log("Set remoteDescription:",a,"for:",b.peer),"OFFER"===a&&g._makeAnswer(b)},function(a){b.provider.emitError("webrtc",a),c.log("Failed to setRemoteDescription, ",a)})},g.handleCandidate=function(a,b){var d=b.candidate,e=b.sdpMLineIndex;a.pc.addIceCandidate(new f({sdpMLineIndex:e,candidate:d})),c.log("Added ICE candidate for:",a.peer)},b.exports=g},{"./adapter":1,"./util":8}],6:[function(a,b){function c(a,b){return this instanceof c?(e.call(this),a&&a.constructor==Object?(b=a,a=void 0):a&&(a=a.toString()),b=d.extend({debug:0,host:d.CLOUD_HOST,port:d.CLOUD_PORT,key:"peerjs",path:"/",token:d.randomToken(),config:d.defaultConfig},b),this.options=b,"/"===b.host&&(b.host=window.location.hostname),"/"!==b.path[0]&&(b.path="/"+b.path),"/"!==b.path[b.path.length-1]&&(b.path+="/"),void 0===b.secure&&b.host!==d.CLOUD_HOST&&(b.secure=d.isSecure()),b.logFunction&&d.setLogFunction(b.logFunction),d.setLogLevel(b.debug),d.supports.audioVideo||d.supports.data?d.validateId(a)?d.validateKey(b.key)?b.secure&&"0.peerjs.com"===b.host?void this._delayedAbort("ssl-unavailable","The cloud server currently does not support HTTPS. Please run your own PeerServer to use HTTPS."):(this.destroyed=!1,this.disconnected=!1,this.open=!1,this.connections={},this._lostMessages={},this._initializeServerConnection(),void(a?this._initialize(a):this._retrieveId())):void this._delayedAbort("invalid-key",'API KEY "'+b.key+'" is invalid'):void this._delayedAbort("invalid-id",'ID "'+a+'" is invalid'):void this._delayedAbort("browser-incompatible","The current browser does not support WebRTC")):new c(a,b)}var d=a("./util"),e=a("eventemitter3"),f=a("./socket"),g=a("./mediaconnection"),h=a("./dataconnection");d.inherits(c,e),c.prototype._initializeServerConnection=function(){var a=this;this.socket=new f(this.options.secure,this.options.host,this.options.port,this.options.path,this.options.key),this.socket.on("message",function(b){a._handleMessage(b)}),this.socket.on("error",function(b){a._abort("socket-error",b)}),this.socket.on("disconnected",function(){a.disconnected||(a.emitError("network","Lost connection to server."),a.disconnect())}),this.socket.on("close",function(){a.disconnected||a._abort("socket-closed","Underlying socket is already closed.")})},c.prototype._retrieveId=function(){var a=this,b=new XMLHttpRequest,c=this.options.secure?"https://":"http://",e=c+this.options.host+":"+this.options.port+this.options.path+this.options.key+"/id",f="?ts="+(new Date).getTime()+Math.random();e+=f,b.open("get",e,!0),b.onerror=function(b){d.error("Error retrieving ID",b);var c="";"/"===a.options.path&&a.options.host!==d.CLOUD_HOST&&(c=" If you passed in a `path` to your self-hosted PeerServer, you'll also need to pass in that same path when creating a new Peer."),a._abort("server-error","Could not get an ID from the server."+c)},b.onreadystatechange=function(){return 4===b.readyState?200!==b.status?void b.onerror():void a._initialize(b.responseText):void 0},b.send(null)},c.prototype._initialize=function(a){this.id=a,this.socket.start(this.id,this.options.token)},c.prototype._handleMessage=function(a){var b,c=a.type,e=a.payload,f=a.src;switch(c){case"OPEN":this.emit("open",this.id),this.open=!0;break;case"ERROR":this._abort("server-error",e.msg);break;case"ID-TAKEN":this._abort("unavailable-id","ID `"+this.id+"` is taken");break;case"INVALID-KEY":this._abort("invalid-key",'API KEY "'+this.options.key+'" is invalid');break;case"LEAVE":d.log("Received leave message from",f),this._cleanupPeer(f);break;case"EXPIRE":this.emitError("peer-unavailable","Could not connect to peer "+f);break;case"OFFER":var i=e.connectionId;if(b=this.getConnection(f,i))d.warn("Offer received for existing Connection ID:",i);else{if("media"===e.type)b=new g(f,this,{connectionId:i,_payload:e,metadata:e.metadata}),this._addConnection(f,b),this.emit("call",b);else{if("data"!==e.type)return void d.warn("Received malformed connection type:",e.type);b=new h(f,this,{connectionId:i,_payload:e,metadata:e.metadata,label:e.label,serialization:e.serialization,reliable:e.reliable}),this._addConnection(f,b),this.emit("connection",b)}for(var j=this._getMessages(i),k=0,l=j.length;l>k;k+=1)b.handleMessage(j[k])}break;default:if(!e)return void d.warn("You received a malformed message from "+f+" of type "+c);var m=e.connectionId;b=this.getConnection(f,m),b&&b.pc?b.handleMessage(a):m?this._storeMessage(m,a):d.warn("You received an unrecognized message:",a)}},c.prototype._storeMessage=function(a,b){this._lostMessages[a]||(this._lostMessages[a]=[]),this._lostMessages[a].push(b)},c.prototype._getMessages=function(a){var b=this._lostMessages[a];return b?(delete this._lostMessages[a],b):[]},c.prototype.connect=function(a,b){if(this.disconnected)return d.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect, or call reconnect on this peer if you believe its ID to still be available."),void this.emitError("disconnected","Cannot connect to new Peer after disconnecting from server.");var c=new h(a,this,b);return this._addConnection(a,c),c},c.prototype.call=function(a,b,c){if(this.disconnected)return d.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect."),void this.emitError("disconnected","Cannot connect to new Peer after disconnecting from server.");if(!b)return void d.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");c=c||{},c._stream=b;var e=new g(a,this,c);return this._addConnection(a,e),e},c.prototype._addConnection=function(a,b){this.connections[a]||(this.connections[a]=[]),this.connections[a].push(b)},c.prototype.getConnection=function(a,b){var c=this.connections[a];if(!c)return null;for(var d=0,e=c.length;e>d;d++)if(c[d].id===b)return c[d];return null},c.prototype._delayedAbort=function(a,b){var c=this;d.setZeroTimeout(function(){c._abort(a,b)})},c.prototype._abort=function(a,b){d.error("Aborting!"),this._lastServerId?this.disconnect():this.destroy(),this.emitError(a,b)},c.prototype.emitError=function(a,b){d.error("Error:",b),"string"==typeof b&&(b=new Error(b)),b.type=a,this.emit("error",b)},c.prototype.destroy=function(){this.destroyed||(this._cleanup(),this.disconnect(),this.destroyed=!0)},c.prototype._cleanup=function(){if(this.connections)for(var a=Object.keys(this.connections),b=0,c=a.length;c>b;b++)this._cleanupPeer(a[b]);this.emit("close")},c.prototype._cleanupPeer=function(a){for(var b=this.connections[a],c=0,d=b.length;d>c;c+=1)b[c].close()},c.prototype.disconnect=function(){var a=this;d.setZeroTimeout(function(){a.disconnected||(a.disconnected=!0,a.open=!1,a.socket&&a.socket.close(),a.emit("disconnected",a.id),a._lastServerId=a.id,a.id=null)})},c.prototype.reconnect=function(){if(this.disconnected&&!this.destroyed)d.log("Attempting reconnection to server with ID "+this._lastServerId),this.disconnected=!1,this._initializeServerConnection(),this._initialize(this._lastServerId);else{if(this.destroyed)throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");if(this.disconnected||this.open)throw new Error("Peer "+this.id+" cannot reconnect because it is not disconnected from the server!");d.error("In a hurry? We're still trying to make the initial connection!")}},c.prototype.listAllPeers=function(a){a=a||function(){};var b=this,c=new XMLHttpRequest,e=this.options.secure?"https://":"http://",f=e+this.options.host+":"+this.options.port+this.options.path+this.options.key+"/peers",g="?ts="+(new Date).getTime()+Math.random();f+=g,c.open("get",f,!0),c.onerror=function(){b._abort("server-error","Could not get peers from the server."),a([])},c.onreadystatechange=function(){if(4===c.readyState){if(401===c.status){var e="";throw e=b.options.host!==d.CLOUD_HOST?"It looks like you're using the cloud server. You can email team@peerjs.com to enable peer listing for your API key.":"You need to enable `allow_discovery` on your self-hosted PeerServer to use this feature.",a([]),new Error("It doesn't look like you have permission to list peers IDs. "+e)}a(200!==c.status?[]:JSON.parse(c.responseText))}},c.send(null)},b.exports=c},{"./dataconnection":2,"./mediaconnection":4,"./socket":7,"./util":8,eventemitter3:9}],7:[function(a,b){function c(a,b,d,f,g){if(!(this instanceof c))return new c(a,b,d,f,g);e.call(this),this.disconnected=!1,this._queue=[];var h=a?"https://":"http://",i=a?"wss://":"ws://";this._httpUrl=h+b+":"+d+f+g,this._wsUrl=i+b+":"+d+f+"peerjs?key="+g}var d=a("./util"),e=a("eventemitter3");d.inherits(c,e),c.prototype.start=function(a,b){this.id=a,this._httpUrl+="/"+a+"/"+b,this._wsUrl+="&id="+a+"&token="+b,this._startXhrStream(),this._startWebSocket()},c.prototype._startWebSocket=function(){var a=this;this._socket||(this._socket=new WebSocket(this._wsUrl),this._socket.onmessage=function(b){try{var c=JSON.parse(b.data)}catch(e){return void d.log("Invalid server message",b.data)}a.emit("message",c)},this._socket.onclose=function(){d.log("Socket closed."),a.disconnected=!0,a.emit("disconnected")},this._socket.onopen=function(){a._timeout&&(clearTimeout(a._timeout),setTimeout(function(){a._http.abort(),a._http=null},5e3)),a._sendQueuedMessages(),d.log("Socket open")})},c.prototype._startXhrStream=function(a){try{var b=this;this._http=new XMLHttpRequest,this._http._index=1,this._http._streamIndex=a||0,this._http.open("post",this._httpUrl+"/id?i="+this._http._streamIndex,!0),this._http.onerror=function(){clearTimeout(b._timeout),b.emit("disconnected")},this._http.onreadystatechange=function(){2==this.readyState&&this.old?(this.old.abort(),delete this.old):this.readyState>2&&200===this.status&&this.responseText&&b._handleStream(this)},this._http.send(null),this._setHTTPTimeout()}catch(c){d.log("XMLHttpRequest not available; defaulting to WebSockets")}},c.prototype._handleStream=function(a){var b=a.responseText.split("\n");if(a._buffer)for(;a._buffer.length>0;){var c=a._buffer.shift(),e=b[c];try{e=JSON.parse(e)}catch(f){a._buffer.shift(c);break}this.emit("message",e)}var g=b[a._index];if(g)if(a._index+=1,a._index===b.length)a._buffer||(a._buffer=[]),a._buffer.push(a._index-1);else{try{g=JSON.parse(g)}catch(f){return void d.log("Invalid server message",g)}this.emit("message",g)}},c.prototype._setHTTPTimeout=function(){var a=this;this._timeout=setTimeout(function(){var b=a._http;a._wsOpen()?b.abort():(a._startXhrStream(b._streamIndex+1),a._http.old=b)},25e3)},c.prototype._wsOpen=function(){return this._socket&&1==this._socket.readyState},c.prototype._sendQueuedMessages=function(){for(var a=0,b=this._queue.length;b>a;a+=1)this.send(this._queue[a])},c.prototype.send=function(a){if(!this.disconnected){if(!this.id)return void this._queue.push(a);if(!a.type)return void this.emit("error","Invalid message");var b=JSON.stringify(a);if(this._wsOpen())this._socket.send(b);else{var c=new XMLHttpRequest,d=this._httpUrl+"/"+a.type.toLowerCase();c.open("post",d,!0),c.setRequestHeader("Content-Type","application/json"),c.send(b)}}},c.prototype.close=function(){!this.disconnected&&this._wsOpen()&&(this._socket.close(),this.disconnected=!0)},b.exports=c},{"./util":8,eventemitter3:9}],8:[function(a,b){var c={iceServers:[{url:"stun:stun.l.google.com:19302"}]},d=1,e=a("js-binarypack"),f=a("./adapter").RTCPeerConnection,g={noop:function(){},CLOUD_HOST:"0.peerjs.com",CLOUD_PORT:9e3,chunkedBrowsers:{Chrome:1},chunkedMTU:16300,logLevel:0,setLogLevel:function(a){var b=parseInt(a,10);g.logLevel=isNaN(parseInt(a,10))?a?3:0:b,g.log=g.warn=g.error=g.noop,g.logLevel>0&&(g.error=g._printWith("ERROR")),g.logLevel>1&&(g.warn=g._printWith("WARNING")),g.logLevel>2&&(g.log=g._print)},setLogFunction:function(a){a.constructor!==Function?g.warn("The log function you passed in is not a function. Defaulting to regular logs."):g._print=a},_printWith:function(a){return function(){var b=Array.prototype.slice.call(arguments);b.unshift(a),g._print.apply(g,b)}},_print:function(){var a=!1,b=Array.prototype.slice.call(arguments);b.unshift("PeerJS: ");for(var c=0,d=b.length;d>c;c++)b[c]instanceof Error&&(b[c]="("+b[c].name+") "+b[c].message,a=!0);a?console.error.apply(console,b):console.log.apply(console,b)},defaultConfig:c,browser:function(){return window.mozRTCPeerConnection?"Firefox":window.webkitRTCPeerConnection?"Chrome":window.RTCPeerConnection?"Supported":"Unsupported"}(),supports:function(){if("undefined"==typeof f)return{};var a,b,d=!0,e=!0,h=!1,i=!1,j=!!window.webkitRTCPeerConnection;try{a=new f(c,{optional:[{RtpDataChannels:!0}]})}catch(k){d=!1,e=!1}if(d)try{b=a.createDataChannel("_PEERJSTEST")}catch(k){d=!1}if(d){try{b.binaryType="blob",h=!0}catch(k){}var l=new f(c,{});try{var m=l.createDataChannel("_PEERJSRELIABLETEST",{});i=m.reliable}catch(k){}l.close()}if(e&&(e=!!a.addStream),!j&&d){var n=new f(c,{optional:[{RtpDataChannels:!0}]});n.onnegotiationneeded=function(){j=!0,g&&g.supports&&(g.supports.onnegotiationneeded=!0)},n.createDataChannel("_PEERJSNEGOTIATIONTEST"),setTimeout(function(){n.close()},1e3)}return a&&a.close(),{audioVideo:e,data:d,binaryBlob:h,binary:i,reliable:i,sctp:i,onnegotiationneeded:j}}(),validateId:function(a){return!a||/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(a)},validateKey:function(a){return!a||/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(a)},debug:!1,inherits:function(a,b){a.super_=b,a.prototype=Object.create(b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}})},extend:function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a},pack:e.pack,unpack:e.unpack,log:function(){if(g.debug){var a=!1,b=Array.prototype.slice.call(arguments);b.unshift("PeerJS: ");for(var c=0,d=b.length;d>c;c++)b[c]instanceof Error&&(b[c]="("+b[c].name+") "+b[c].message,a=!0);a?console.error.apply(console,b):console.log.apply(console,b)}},setZeroTimeout:function(a){function b(b){d.push(b),a.postMessage(e,"*")}function c(b){b.source==a&&b.data==e&&(b.stopPropagation&&b.stopPropagation(),d.length&&d.shift()())}var d=[],e="zero-timeout-message";return a.addEventListener?a.addEventListener("message",c,!0):a.attachEvent&&a.attachEvent("onmessage",c),b}(window),chunk:function(a){for(var b=[],c=a.size,e=index=0,f=Math.ceil(c/g.chunkedMTU);c>e;){var h=Math.min(c,e+g.chunkedMTU),i=a.slice(e,h),j={__peerData:d,n:index,data:i,total:f};b.push(j),e=h,index+=1}return d+=1,b},blobToArrayBuffer:function(a,b){var c=new FileReader;c.onload=function(a){b(a.target.result)},c.readAsArrayBuffer(a)},blobToBinaryString:function(a,b){var c=new FileReader;c.onload=function(a){b(a.target.result)},c.readAsBinaryString(a)},binaryStringToArrayBuffer:function(a){for(var b=new Uint8Array(a.length),c=0;c<a.length;c++)b[c]=255&a.charCodeAt(c);return b.buffer},randomToken:function(){return Math.random().toString(36).substr(2)},isSecure:function(){return"https:"===location.protocol}};b.exports=g},{"./adapter":1,"js-binarypack":10}],9:[function(a,b){"use strict";function c(a,b,c){this.fn=a,this.context=b,this.once=c||!1}function d(){}d.prototype._events=void 0,d.prototype.listeners=function(a){if(!this._events||!this._events[a])return[];for(var b=0,c=this._events[a].length,d=[];c>b;b++)d.push(this._events[a][b].fn);return d},d.prototype.emit=function(a,b,c,d,e,f){if(!this._events||!this._events[a])return!1;var g,h,i,j=this._events[a],k=j.length,l=arguments.length,m=j[0];if(1===k){switch(m.once&&this.removeListener(a,m.fn,!0),l){case 1:return m.fn.call(m.context),!0;case 2:return m.fn.call(m.context,b),!0;case 3:return m.fn.call(m.context,b,c),!0;case 4:return m.fn.call(m.context,b,c,d),!0;case 5:return m.fn.call(m.context,b,c,d,e),!0;case 6:return m.fn.call(m.context,b,c,d,e,f),!0}for(h=1,g=new Array(l-1);l>h;h++)g[h-1]=arguments[h];m.fn.apply(m.context,g)}else for(h=0;k>h;h++)switch(j[h].once&&this.removeListener(a,j[h].fn,!0),l){case 1:j[h].fn.call(j[h].context);break;case 2:j[h].fn.call(j[h].context,b);break;case 3:j[h].fn.call(j[h].context,b,c);break;default:if(!g)for(i=1,g=new Array(l-1);l>i;i++)g[i-1]=arguments[i];j[h].fn.apply(j[h].context,g)}return!0},d.prototype.on=function(a,b,d){return this._events||(this._events={}),this._events[a]||(this._events[a]=[]),this._events[a].push(new c(b,d||this)),this},d.prototype.once=function(a,b,d){return this._events||(this._events={}),this._events[a]||(this._events[a]=[]),this._events[a].push(new c(b,d||this,!0)),this},d.prototype.removeListener=function(a,b,c){if(!this._events||!this._events[a])return this;var d=this._events[a],e=[];if(b)for(var f=0,g=d.length;g>f;f++)d[f].fn!==b&&d[f].once!==c&&e.push(d[f]);return this._events[a]=e.length?e:null,this},d.prototype.removeAllListeners=function(a){return this._events?(a?this._events[a]=null:this._events={},this):this},d.prototype.off=d.prototype.removeListener,d.prototype.addListener=d.prototype.on,d.prototype.setMaxListeners=function(){return this},d.EventEmitter=d,d.EventEmitter2=d,d.EventEmitter3=d,"object"==typeof b&&b.exports&&(b.exports=d)},{}],10:[function(a,b){function c(a){this.index=0,this.dataBuffer=a,this.dataView=new Uint8Array(this.dataBuffer),this.length=this.dataBuffer.byteLength}function d(){this.bufferBuilder=new g}function e(a){var b=a.charCodeAt(0);return 2047>=b?"00":65535>=b?"000":2097151>=b?"0000":67108863>=b?"00000":"000000"}function f(a){return a.length>600?new Blob([a]).size:a.replace(/[^\u0000-\u007F]/g,e).length}var g=a("./bufferbuilder").BufferBuilder,h=a("./bufferbuilder").binaryFeatures,i={unpack:function(a){var b=new c(a);return b.unpack()},pack:function(a){var b=new d;b.pack(a);var c=b.getBuffer();return c}};b.exports=i,c.prototype.unpack=function(){var a=this.unpack_uint8();if(128>a){var b=a;return b}if(32>(224^a)){var c=(224^a)-32;return c}var d;if((d=160^a)<=15)return this.unpack_raw(d);if((d=176^a)<=15)return this.unpack_string(d);if((d=144^a)<=15)return this.unpack_array(d);if((d=128^a)<=15)return this.unpack_map(d);switch(a){case 192:return null;case 193:return void 0;case 194:return!1;case 195:return!0;case 202:return this.unpack_float();case 203:return this.unpack_double();case 204:return this.unpack_uint8();case 205:return this.unpack_uint16();case 206:return this.unpack_uint32();case 207:return this.unpack_uint64();case 208:return this.unpack_int8();case 209:return this.unpack_int16();case 210:return this.unpack_int32();case 211:return this.unpack_int64();case 212:return void 0;case 213:return void 0;case 214:return void 0;case 215:return void 0;case 216:return d=this.unpack_uint16(),this.unpack_string(d);case 217:return d=this.unpack_uint32(),this.unpack_string(d);case 218:return d=this.unpack_uint16(),this.unpack_raw(d);case 219:return d=this.unpack_uint32(),this.unpack_raw(d);case 220:return d=this.unpack_uint16(),this.unpack_array(d);case 221:return d=this.unpack_uint32(),this.unpack_array(d);case 222:return d=this.unpack_uint16(),this.unpack_map(d);case 223:return d=this.unpack_uint32(),this.unpack_map(d)}},c.prototype.unpack_uint8=function(){var a=255&this.dataView[this.index];return this.index++,a},c.prototype.unpack_uint16=function(){var a=this.read(2),b=256*(255&a[0])+(255&a[1]);return this.index+=2,b},c.prototype.unpack_uint32=function(){var a=this.read(4),b=256*(256*(256*a[0]+a[1])+a[2])+a[3];return this.index+=4,b},c.prototype.unpack_uint64=function(){var a=this.read(8),b=256*(256*(256*(256*(256*(256*(256*a[0]+a[1])+a[2])+a[3])+a[4])+a[5])+a[6])+a[7];return this.index+=8,b},c.prototype.unpack_int8=function(){var a=this.unpack_uint8();return 128>a?a:a-256},c.prototype.unpack_int16=function(){var a=this.unpack_uint16();return 32768>a?a:a-65536},c.prototype.unpack_int32=function(){var a=this.unpack_uint32();return a<Math.pow(2,31)?a:a-Math.pow(2,32)},c.prototype.unpack_int64=function(){var a=this.unpack_uint64();return a<Math.pow(2,63)?a:a-Math.pow(2,64)},c.prototype.unpack_raw=function(a){if(this.length<this.index+a)throw new Error("BinaryPackFailure: index is out of range "+this.index+" "+a+" "+this.length);var b=this.dataBuffer.slice(this.index,this.index+a);return this.index+=a,b},c.prototype.unpack_string=function(a){for(var b,c,d=this.read(a),e=0,f="";a>e;)b=d[e],128>b?(f+=String.fromCharCode(b),e++):32>(192^b)?(c=(192^b)<<6|63&d[e+1],f+=String.fromCharCode(c),e+=2):(c=(15&b)<<12|(63&d[e+1])<<6|63&d[e+2],f+=String.fromCharCode(c),e+=3);return this.index+=a,f},c.prototype.unpack_array=function(a){for(var b=new Array(a),c=0;a>c;c++)b[c]=this.unpack();return b},c.prototype.unpack_map=function(a){for(var b={},c=0;a>c;c++){var d=this.unpack(),e=this.unpack();b[d]=e}return b},c.prototype.unpack_float=function(){var a=this.unpack_uint32(),b=a>>31,c=(a>>23&255)-127,d=8388607&a|8388608;return(0==b?1:-1)*d*Math.pow(2,c-23)},c.prototype.unpack_double=function(){var a=this.unpack_uint32(),b=this.unpack_uint32(),c=a>>31,d=(a>>20&2047)-1023,e=1048575&a|1048576,f=e*Math.pow(2,d-20)+b*Math.pow(2,d-52);return(0==c?1:-1)*f},c.prototype.read=function(a){var b=this.index;if(b+a<=this.length)return this.dataView.subarray(b,b+a);throw new Error("BinaryPackFailure: read index out of range")},d.prototype.getBuffer=function(){return this.bufferBuilder.getBuffer()},d.prototype.pack=function(a){var b=typeof a;if("string"==b)this.pack_string(a);else if("number"==b)Math.floor(a)===a?this.pack_integer(a):this.pack_double(a);else if("boolean"==b)a===!0?this.bufferBuilder.append(195):a===!1&&this.bufferBuilder.append(194);else if("undefined"==b)this.bufferBuilder.append(192);else{if("object"!=b)throw new Error('Type "'+b+'" not yet supported');if(null===a)this.bufferBuilder.append(192);else{var c=a.constructor;if(c==Array)this.pack_array(a);else if(c==Blob||c==File)this.pack_bin(a);
else if(c==ArrayBuffer)this.pack_bin(h.useArrayBufferView?new Uint8Array(a):a);else if("BYTES_PER_ELEMENT"in a)this.pack_bin(h.useArrayBufferView?new Uint8Array(a.buffer):a.buffer);else if(c==Object)this.pack_object(a);else if(c==Date)this.pack_string(a.toString());else{if("function"!=typeof a.toBinaryPack)throw new Error('Type "'+c.toString()+'" not yet supported');this.bufferBuilder.append(a.toBinaryPack())}}}this.bufferBuilder.flush()},d.prototype.pack_bin=function(a){var b=a.length||a.byteLength||a.size;if(15>=b)this.pack_uint8(160+b);else if(65535>=b)this.bufferBuilder.append(218),this.pack_uint16(b);else{if(!(4294967295>=b))throw new Error("Invalid length");this.bufferBuilder.append(219),this.pack_uint32(b)}this.bufferBuilder.append(a)},d.prototype.pack_string=function(a){var b=f(a);if(15>=b)this.pack_uint8(176+b);else if(65535>=b)this.bufferBuilder.append(216),this.pack_uint16(b);else{if(!(4294967295>=b))throw new Error("Invalid length");this.bufferBuilder.append(217),this.pack_uint32(b)}this.bufferBuilder.append(a)},d.prototype.pack_array=function(a){var b=a.length;if(15>=b)this.pack_uint8(144+b);else if(65535>=b)this.bufferBuilder.append(220),this.pack_uint16(b);else{if(!(4294967295>=b))throw new Error("Invalid length");this.bufferBuilder.append(221),this.pack_uint32(b)}for(var c=0;b>c;c++)this.pack(a[c])},d.prototype.pack_integer=function(a){if(a>=-32&&127>=a)this.bufferBuilder.append(255&a);else if(a>=0&&255>=a)this.bufferBuilder.append(204),this.pack_uint8(a);else if(a>=-128&&127>=a)this.bufferBuilder.append(208),this.pack_int8(a);else if(a>=0&&65535>=a)this.bufferBuilder.append(205),this.pack_uint16(a);else if(a>=-32768&&32767>=a)this.bufferBuilder.append(209),this.pack_int16(a);else if(a>=0&&4294967295>=a)this.bufferBuilder.append(206),this.pack_uint32(a);else if(a>=-2147483648&&2147483647>=a)this.bufferBuilder.append(210),this.pack_int32(a);else if(a>=-0x8000000000000000&&0x8000000000000000>=a)this.bufferBuilder.append(211),this.pack_int64(a);else{if(!(a>=0&&0x10000000000000000>=a))throw new Error("Invalid integer");this.bufferBuilder.append(207),this.pack_uint64(a)}},d.prototype.pack_double=function(a){var b=0;0>a&&(b=1,a=-a);var c=Math.floor(Math.log(a)/Math.LN2),d=a/Math.pow(2,c)-1,e=Math.floor(d*Math.pow(2,52)),f=Math.pow(2,32),g=b<<31|c+1023<<20|e/f&1048575,h=e%f;this.bufferBuilder.append(203),this.pack_int32(g),this.pack_int32(h)},d.prototype.pack_object=function(a){var b=Object.keys(a),c=b.length;if(15>=c)this.pack_uint8(128+c);else if(65535>=c)this.bufferBuilder.append(222),this.pack_uint16(c);else{if(!(4294967295>=c))throw new Error("Invalid length");this.bufferBuilder.append(223),this.pack_uint32(c)}for(var d in a)a.hasOwnProperty(d)&&(this.pack(d),this.pack(a[d]))},d.prototype.pack_uint8=function(a){this.bufferBuilder.append(a)},d.prototype.pack_uint16=function(a){this.bufferBuilder.append(a>>8),this.bufferBuilder.append(255&a)},d.prototype.pack_uint32=function(a){var b=4294967295&a;this.bufferBuilder.append((4278190080&b)>>>24),this.bufferBuilder.append((16711680&b)>>>16),this.bufferBuilder.append((65280&b)>>>8),this.bufferBuilder.append(255&b)},d.prototype.pack_uint64=function(a){var b=a/Math.pow(2,32),c=a%Math.pow(2,32);this.bufferBuilder.append((4278190080&b)>>>24),this.bufferBuilder.append((16711680&b)>>>16),this.bufferBuilder.append((65280&b)>>>8),this.bufferBuilder.append(255&b),this.bufferBuilder.append((4278190080&c)>>>24),this.bufferBuilder.append((16711680&c)>>>16),this.bufferBuilder.append((65280&c)>>>8),this.bufferBuilder.append(255&c)},d.prototype.pack_int8=function(a){this.bufferBuilder.append(255&a)},d.prototype.pack_int16=function(a){this.bufferBuilder.append((65280&a)>>8),this.bufferBuilder.append(255&a)},d.prototype.pack_int32=function(a){this.bufferBuilder.append(a>>>24&255),this.bufferBuilder.append((16711680&a)>>>16),this.bufferBuilder.append((65280&a)>>>8),this.bufferBuilder.append(255&a)},d.prototype.pack_int64=function(a){var b=Math.floor(a/Math.pow(2,32)),c=a%Math.pow(2,32);this.bufferBuilder.append((4278190080&b)>>>24),this.bufferBuilder.append((16711680&b)>>>16),this.bufferBuilder.append((65280&b)>>>8),this.bufferBuilder.append(255&b),this.bufferBuilder.append((4278190080&c)>>>24),this.bufferBuilder.append((16711680&c)>>>16),this.bufferBuilder.append((65280&c)>>>8),this.bufferBuilder.append(255&c)}},{"./bufferbuilder":11}],11:[function(a,b){function c(){this._pieces=[],this._parts=[]}var d={};d.useBlobBuilder=function(){try{return new Blob([]),!1}catch(a){return!0}}(),d.useArrayBufferView=!d.useBlobBuilder&&function(){try{return 0===new Blob([new Uint8Array([])]).size}catch(a){return!0}}(),b.exports.binaryFeatures=d;var e=b.exports.BlobBuilder;"undefined"!=typeof window&&(e=b.exports.BlobBuilder=window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder||window.BlobBuilder),c.prototype.append=function(a){"number"==typeof a?this._pieces.push(a):(this.flush(),this._parts.push(a))},c.prototype.flush=function(){if(this._pieces.length>0){var a=new Uint8Array(this._pieces);d.useArrayBufferView||(a=a.buffer),this._parts.push(a),this._pieces=[]}},c.prototype.getBuffer=function(){if(this.flush(),d.useBlobBuilder){for(var a=new e,b=0,c=this._parts.length;c>b;b++)a.append(this._parts[b]);return a.getBlob()}return new Blob(this._parts)},b.exports.BufferBuilder=c},{}],12:[function(a,b){function c(a,b){return this instanceof c?(this._dc=a,d.debug=b,this._outgoing={},this._incoming={},this._received={},this._window=1e3,this._mtu=500,this._interval=0,this._count=0,this._queue=[],void this._setupDC()):new c(a)}var d=a("./util");c.prototype.send=function(a){var b=d.pack(a);return b.size<this._mtu?void this._handleSend(["no",b]):(this._outgoing[this._count]={ack:0,chunks:this._chunk(b)},d.debug&&(this._outgoing[this._count].timer=new Date),this._sendWindowedChunks(this._count),void(this._count+=1))},c.prototype._setupInterval=function(){var a=this;this._timeout=setInterval(function(){var b=a._queue.shift();if(b._multiple)for(var c=0,d=b.length;d>c;c+=1)a._intervalSend(b[c]);else a._intervalSend(b)},this._interval)},c.prototype._intervalSend=function(a){var b=this;a=d.pack(a),d.blobToBinaryString(a,function(a){b._dc.send(a)}),0===b._queue.length&&(clearTimeout(b._timeout),b._timeout=null)},c.prototype._processAcks=function(){for(var a in this._outgoing)this._outgoing.hasOwnProperty(a)&&this._sendWindowedChunks(a)},c.prototype._handleSend=function(a){for(var b=!0,c=0,d=this._queue.length;d>c;c+=1){var e=this._queue[c];e===a?b=!1:e._multiple&&-1!==e.indexOf(a)&&(b=!1)}b&&(this._queue.push(a),this._timeout||this._setupInterval())},c.prototype._setupDC=function(){var a=this;this._dc.onmessage=function(b){var c=b.data,e=c.constructor;if(e===String){var f=d.binaryStringToArrayBuffer(c);c=d.unpack(f),a._handleMessage(c)}}},c.prototype._handleMessage=function(a){var b,c=a[1],e=this._incoming[c],f=this._outgoing[c];switch(a[0]){case"no":var g=c;g&&this.onmessage(d.unpack(g));break;case"end":if(b=e,this._received[c]=a[2],!b)break;this._ack(c);break;case"ack":if(b=f){var h=a[2];b.ack=Math.max(h,b.ack),b.ack>=b.chunks.length?(d.log("Time: ",new Date-b.timer),delete this._outgoing[c]):this._processAcks()}break;case"chunk":if(b=e,!b){var i=this._received[c];if(i===!0)break;b={ack:["ack",c,0],chunks:[]},this._incoming[c]=b}var j=a[2],k=a[3];b.chunks[j]=new Uint8Array(k),j===b.ack[2]&&this._calculateNextAck(c),this._ack(c);break;default:this._handleSend(a)}},c.prototype._chunk=function(a){for(var b=[],c=a.size,e=0;c>e;){var f=Math.min(c,e+this._mtu),g=a.slice(e,f),h={payload:g};b.push(h),e=f}return d.log("Created",b.length,"chunks."),b},c.prototype._ack=function(a){var b=this._incoming[a].ack;this._received[a]===b[2]&&(this._complete(a),this._received[a]=!0),this._handleSend(b)},c.prototype._calculateNextAck=function(a){for(var b=this._incoming[a],c=b.chunks,d=0,e=c.length;e>d;d+=1)if(void 0===c[d])return void(b.ack[2]=d);b.ack[2]=c.length},c.prototype._sendWindowedChunks=function(a){d.log("sendWindowedChunks for: ",a);for(var b=this._outgoing[a],c=b.chunks,e=[],f=Math.min(b.ack+this._window,c.length),g=b.ack;f>g;g+=1)c[g].sent&&g!==b.ack||(c[g].sent=!0,e.push(["chunk",a,g,c[g].payload]));b.ack+this._window>=c.length&&e.push(["end",a,c.length]),e._multiple=!0,this._handleSend(e)},c.prototype._complete=function(a){d.log("Completed called for",a);var b=this,c=this._incoming[a].chunks,e=new Blob(c);d.blobToArrayBuffer(e,function(a){b.onmessage(d.unpack(a))}),delete this._incoming[a]},c.higherBandwidthSDP=function(a){var b=navigator.appVersion.match(/Chrome\/(.*?) /);if(b&&(b=parseInt(b[1].split(".").shift()),31>b)){var c=a.split("b=AS:30"),d="b=AS:102400";if(c.length>1)return c[0]+d+c[1]}return a},c.prototype.onmessage=function(){},b.exports.Reliable=c},{"./util":13}],13:[function(a,b){var c=a("js-binarypack"),d={debug:!1,inherits:function(a,b){a.super_=b,a.prototype=Object.create(b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}})},extend:function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a},pack:c.pack,unpack:c.unpack,log:function(){if(d.debug){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];a.unshift("Reliable: "),console.log.apply(console,a)}},setZeroTimeout:function(a){function b(b){d.push(b),a.postMessage(e,"*")}function c(b){b.source==a&&b.data==e&&(b.stopPropagation&&b.stopPropagation(),d.length&&d.shift()())}var d=[],e="zero-timeout-message";return a.addEventListener?a.addEventListener("message",c,!0):a.attachEvent&&a.attachEvent("onmessage",c),b}(this),blobToArrayBuffer:function(a,b){var c=new FileReader;c.onload=function(a){b(a.target.result)},c.readAsArrayBuffer(a)},blobToBinaryString:function(a,b){var c=new FileReader;c.onload=function(a){b(a.target.result)},c.readAsBinaryString(a)},binaryStringToArrayBuffer:function(a){for(var b=new Uint8Array(a.length),c=0;c<a.length;c++)b[c]=255&a.charCodeAt(c);return b.buffer},randomToken:function(){return Math.random().toString(36).substr(2)}};b.exports=d},{"js-binarypack":10}]},{},[3]);
    },

    // enum EventType
    // {
    //     Initialized = 1
    //     Connected = 2,
    //     Received = 3,
    //     ConnClosed = 4,
    //     PeerDisconnected = 5,
    //     PeerClosed = 6,
    //     Error = 7,
    // }

    OpenPeer: function (key, id, host, port) {
        
        var keystr = UTF8ToString(key);
        var idstr = UTF8ToString(id);
        var hoststr = UTF8ToString(host);

        var peer = {
            peer: new Peer(idstr, { key: keystr, debug: 2, host: hoststr, port: port}),
            initialized: false,
            conns: [],
            events: [],
        };

        var peerInstance = UnityPeerJS.peers.push(peer) - 1;

        peer.newConnection = function (conn) {

            var connInstance = peer.conns.push(conn) - 1;

            conn.on('open', function () {

                peer.events.push({ ev: 2, conn: connInstance, id: conn.peer });

                conn.on('data', function (data) {

                    peer.events.push({ ev: 3, conn: connInstance, data: data });
                });
            });

            conn.on('close', function () {

                peer.events.push({ ev: 4, conn: connInstance });
            });
        };

        peer.popEvent = function (eventType) {
            
            if (peer.events.length == 0) {
                console.log("error: popEvent: event queue is empty");
                return null;
            }

            if (eventType != 0 && peer.events[0].ev != eventType) {
                console.log("error: popEvent: event type mismatch", eventType, peer.events[0].ev);
                return null;
            }

            var result = peer.events.shift();
            return result;
        };

        peer.peer.on('open', function (id) {

            peer.initialized = true;
            peer.events.push({ ev: 1 });
        });

        peer.peer.on('connection', peer.newConnection);
        peer.peer.on('disconnected', function () { peer.events.push({ ev: 5 }) });
        peer.peer.on('close', function () { peer.events.push({ ev: 6 }) });
        peer.peer.on('error', function (err) { peer.events.push({ ev: 7, err: err.type }) });

        return peerInstance;
    },

    Connect: function (peerInstance, id) {
        
        var idstr = UTF8ToString(id);
        var peer = UnityPeerJS.peers[peerInstance];
        
        console.log('connecting to', idstr);
        
        peer.newConnection(peer.peer.connect(idstr));
    },

    Send: function (peerInstance, connInstance, data, length) {

        var peer = UnityPeerJS.peers[peerInstance];
        var conn = peer.conns[connInstance];
        var datastr = UTF8ToString(data);

        console.log('sending data', length);

        conn.send(datastr);
    },

    ConnClose: function (peerInstance, connInstance) {

        var peer = UnityPeerJS.peers[peerInstance];
        var conn = peer.conns[connInstance];

        conn.close();
    },

    PeerDisconnect: function (peerInstance) {

        var peer = UnityPeerJS.peers[peerInstance];

        peer.disconnect();
    },

    PeerDestroy: function (peerInstance) {

        var peer = UnityPeerJS.peers[peerInstance];

        peer.destroy();
    },

    NextEventType: function (peerInstance) {

        var peer = UnityPeerJS.peers[peerInstance];

        if (peer.events.length == 0)
            return "";

        return peer.events[0].ev;
    },

    PopAnyEvent: function (peerInstance) {

        var peer = UnityPeerJS.peers[peerInstance];

        peer.popEvent(0);
    },

    PopInitializedEvent: function (peerInstance) {

        var peer = UnityPeerJS.peers[peerInstance];
        var ev = peer.popEvent(1);
    },

    PopConnectedEvent: function (peerInstance, remoteIdPtr, remoteIdMaxLength) {

        var peer = UnityPeerJS.peers[peerInstance];
        var ev = peer.popEvent(2);
        
        console.log("conntected", ev.id);
        
        // Replace deprecated writeStringToMemory with stringToUTF8
        stringToUTF8(ev.id, remoteIdPtr, remoteIdMaxLength);

        return ev.conn;
    },

    PeekReceivedEventSize: function (peerInstance) {
        
        var peer = UnityPeerJS.peers[peerInstance];
        
        if (peer.events.length == 0) {
            console.error("error: PeekReceivedEventSize: no event to peek at");
            return 0;
        }

        var ev = peer.events[0];
        
        if (ev.ev == 3) {
            return lengthBytesUTF8(ev.data);
        }
        
        if (ev.ev == 2) {
            return lengthBytesUTF8(ev.id);
        }
        
        console.error("error: PeekReceivedEventSize: next event is of wrong type", ev.ev);
        return 0;
    },

    PopReceivedEvent: function (peerInstance, dataPtr, dataMaxLength) {

        var peer = UnityPeerJS.peers[peerInstance];
        var ev = peer.popEvent(3);
        
        console.log("received ", ev.data);

        if (ArrayBuffer.isView(ev.data)) {
            console.log("Array buffers not supported");
            return ev.conn;
        }
        
        // Replace deprecated writeStringToMemory with stringToUTF8
        stringToUTF8(ev.data, dataPtr, dataMaxLength);

        return ev.conn;
    },

    PopConnClosedEvent: function (peerInstance) {
        
        var peer = UnityPeerJS.peers[peerInstance];
        var ev = peer.popEvent(4);

        return ev.conn;
    },

    PopPeerDisconnectedEvent: function (peerInstance) {
        
        var peer = UnityPeerJS.peers[peerInstance];
        var ev = peer.popEvent(5);
    },

    PopPeerClosedEvent: function (peerInstance) {
        
        var peer = UnityPeerJS.peers[peerInstance];
        var ev = peer.popEvent(6);
    },

    PopErrorEvent: function (peerInstance, errorPtr, errorMaxLength) {
        
        var peer = UnityPeerJS.peers[peerInstance];
        var ev = peer.popEvent(7);

        var str = ev.err.slice(0, Math.max(0, errorMaxLength / 2 - 1));

        // Replace deprecated writeStringToMemory with stringToUTF8
        stringToUTF8(str, errorPtr, errorMaxLength);
    },
};

autoAddDeps(LibraryUnityPeerJS, '$UnityPeerJS');
mergeInto(LibraryManager.library, LibraryUnityPeerJS);