function FanfouLib(user, passwd, callback){
  this.username = user;
  this.passwd = passwd;
  this.getSelfInfo();
  
  if (callback){
    setTimeout(function(){callback()}, 10);
  }
}

FanfouLib.URLS = {
  BASE: "http://fanfou.com/",
  API_HOST : "http://api.fanfou.com/"
}

FanfouLib.prototype.ajaxRequest = function(url, callback, context, params, httpMethod){
  if (!httpMethod){
    httpMethod = "GET";
  }
  if (!params) {
    params = {};
  }
  $.extend(params, {source : 'cfan'});
  
  var that = this;
  $.ajax({
      type: httpMethod,
      url: FanfouLib.URLS.API_HOST + url + ".json",
      data: params,
      dataType : "json",
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
  this.ajaxRequest("account/verify_credentials", function(success, data){
    if (success){
      //save
      localStorage.id = data.id; 
    }
  });
}

FanfouLib.prototype.tweet = function(callback, msg, replyId, imgFiles){
  params = {
    status : msg
  };
  if (replyId){
    params.in_reply_to_status_id = replyId
  }
  if (imgFiles != null && imgFiles.length > 0){
    
  }else{
    this.ajaxRequest("statuses/update", callback, null, params, "POST");
  }
}

FanfouLib.prototype.retweet = function(callback, msg, repostId){
  params = {status : msg};
  if (repostId){
    params.repost_status_id = repostId;
  }
  this.ajaxRequest("statuses/update", callback, null, params, "POST");
}

FanfouLib.prototype.destroy = function(callback, id){
  this.ajaxRequest("statuses/destroy/" + id, callback, null, null, "POST");
}

FanfouLib.prototype.destroyDM = function(callback, id){
  this.ajaxRequest("direct_messages/destroy/" + id, callback, null, null, "POST");
}

FanfouLib.prototype.favorite = function(callback, id){
  this.ajaxRequest("favorites/create/" + id, callback, null, null, "POST"); 
}

FanfouLib.prototype.unfavorite = function(callback, id){
  this.ajaxRequest("favorites/destroy/" + id, callback, null, null, "POST");
}

FanfouLib.prototype.showTweet = function(callback, id){
  this.ajaxRequest("statuses/show/"+id, callback, null, null, "POST");
}

FanfouLib.prototype.timeline = function(path, callback, context, count, page, sinceId, maxId){
  var params = {};
  if (count)
    params.count = count;
  if (page)
    params.page = page;

  if (sinceId)
    params.since_id = sinceId;

  if (maxId)
    params.max_id = maxId
  params["format"] = "html";

  this.ajaxRequest(path, callback, context, params);
}
