function FanfouLib(user, passwd){
  this.username = user;
  this.passwd = passwd;
  this.info = {}
}

FanfouLib.URLS = {
  BASE: "http://fanfou.com/",
  API_HOST : "http://api2.fanfou.com/"
}

FanfouLib.prototype.ajaxRequest = function(url, callback, context, params, httpMethod){
  if (!httpMethod){
    httpMethod = "GET";
  }
  var that = this;
  $.ajax({
      type: httpMethod,
      url: FanfouLib.URLS.API_HOST + url + ".json",
      data: params,
      dataType : "json",
      timeout: 6000,
      beforeSend : function(xhr){
        var auth = binb2b64(str2binb(that.username + ":"+that.passwd));
        xhr.setRequestHeader("Authorization", "Basic " + auth);
      },
      success : function(data, status){
        callback(true, data, status, context);
      },
      error : function(request, status, error){
        callback(false, null, status, context);
      }
  })
}

FanfouLib.prototype.getSelfInfo = function(){
  var that = this;
  //个人信息
  this.ajaxRequest("account/verify_credentials", function(success, data){
    if (success){
      console.log(data);
      FanfouLib.info = data; 
    }
  });
}

FanfouLib.prototype.tweet = function(callback, msg){
  params = {status : msg};
  this.ajaxRequest("statuses/update", callback, null, params, "POST");
}

FanfouLib.prototype.friendsTimeline = function(callback, context, count, page, sinceId, maxId){
  var params = {};
  if (count)
    params.count = count;
  if (page)
    params.page = page;

  if (sinceId)
    params.sinceId = sinceId;

  if (maxId)
    params.maxId = maxId

  params["format"] = "html";

  this.ajaxRequest("statuses/friends_timeline", callback, context, params);
}
