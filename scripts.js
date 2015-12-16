var UbkClient  = require('./node_modules/ubk/client/ws'),
    Class      = require('uclass'),
    Events     = require('uclass/events');

function getAlbumArt (url){
    var file = url;
    
    function callback() 
    {
        var artist = ID3.getTag(file, "artist");
        var title = ID3.getTag(file, "title");
        var album = ID3.getTag(file, "album");
        
        document.getElementById('id3_artist').innerHTML = artist;
        document.getElementById('id3_title').innerHTML = title;
        document.getElementById('id3_album').innerHTML = album;
  };
  
  ID3.loadTags(url, callback, ["picture", "artist", "title", "album"]);
}

function register_command(ubk) {

  console.log('register_command ?');

    ubk.register_cmd('base', 'send_test', function(data){
      alert('TESSSST');
    });

}

getAlbumArt('Kalimba.mp3');

var ubk = new UbkClient('http://172.19.21.59:8001');
var ondeconnection = function() {
  setTimeout(function() {
    alert("connection lost");
    document.location = document.location.href;
  }, 100);
};

var onconnection = function(ubk) {
  console.log('onconnection ?');
  register_command(ubk);
};

ubk.connect(function() { console.log('CONNECTED ?'); onconnection(ubk); } , ondeconnection);



document.getElementById('test').addEventListener('click', function() {

  var callback = function() {
        console.log('its ok');
      },
      request = {
        'its' : 'a trap'
      };
  ubk.send('base', 'send_test', request, callback);
});