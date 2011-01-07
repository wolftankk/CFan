function Timeline(timelineid, manager, recheckTime){
  //console.log(recheckTime)
  this.timelineId = timelineid;
  this.manager = manager;
  this.recheckTime = recheckTime;

  this.tweetsCache = [];
  this.newTweetsCache = [];
  this.unreadNotified = [];
  this.timerId = null;
  this.currentError = null;
  this.currentCallback = null;
  this.currentScroll = 0;
  this.firstRun = true;
  this.timelineId = timelineid;
   
  switch (timelineid){
    case 'home':
      this.timelinePath = 'statuses/friends_timeline';
      break;
    case 'mentions':
      this.timelinePath = "statuses/replies";
      break;
    case 'dms':
      this.timelinePath = "direct_messages";
      break;
  }
}

Timeline.prototype.setError = function(status){
  this.currentError = status;
}

Timeline.prototype.stopTimer = function(){
  if (this.timerId){
    clearTimeout(this.timerId);
    this.timerId = null;
  }
}

Timeline.prototype.onFetchNew = function(success, tweets, status, context){
  var that = this;
  if (!success){
    this.setError(status);
    if (context.onFinish){
      context.onFinish(0)
    }
    this.timerId = setTimeout(function(){ that.fetchNewTweets.call(that) }, this.recheckTime);
    return;
  }
  this.setError(null);

  var unreadLength = 0;
  for (var t = tweets.length - 1; t >= 0; --t){
    this.newTweetsCache.unshift(tweets[t]);
    var tid = tweets[t].id;
    if (context.onFinish){
      this.manager.readTweet(tid);
    }else{
      if (!this.manager.readTweets[tid]){
        ++unreadLength;
        this.manager.unreadTweets[tid] = true;
      }
    }
   } 
   if (tweets.length > 0 ){
     this.manager.notifyNewTweets(this.timelineId, this.newTweetsCache.length, unreadLength);
   }
   if (context.onFinish){
     context.onFinish(tweets.length);
   }
  
  this.timerId = setTimeout(function(){ that.fetchNewTweets.call(that); }, this.recheckTime);
}

Timeline.prototype.fetchNewTweets = function(callback){
  this.stopTimer();
  var lastId = null;
  if (this.newTweetsCache.length > 0){
    lastId = this.newTweetsCache[0].id;
  }else{
    if (this.tweetsCache.length > 0){
      lastId = this.tweetsCache[0].id;
    }
  }

  var that = this;
  var context = {onFinish : callback}
  this.manager.ffBackend.timeline(this.timelinePath, function(success, tweets, status, context){
    that.onFetchNew.call(that, success, tweets, status, context) 
  }, context, null, null, lastId);
}

Timeline.prototype.onFetch = function(success, tweets, status, context){
  if (!success){
    this.setError(status);
    this.currentCallback(null);
    this.setError(null)
    this.currentCallback = null;
    return;
  }
  this.setError(null);
  var t = 0;
  if (context.usingMaxId){
    t = 1;
    //console.log("usingMaxId");
  }

  for (; t < tweets.length; ++t){
    this.tweetsCache.push(tweets[t]);
  }
  this.currentCallback(this.tweetsCache, this.timelineId);
  this.currentCallback = null;
  if (this.firstRun){
    this.firstRun = false;
    this.fetchNewTweets();
  }
}

Timeline.prototype.giveMeTweets = function(callback, syncNew, cacheOnly){
  if (this.currentCallback){
      this.currentCallback = callback;
      return;
  }
    
  if (syncNew){
    var oldCallback = this.manager.newTweetsCallback;
    var that = this;
    this.currentCallback = callback;
    this.manager.newTweetsCallback = null;
    var onFinishCallback = function(){
      var tweetsCallback = that.currentCallback;
      that.currentCallback = null;
      that.updateNewTweets();
      that.manager.updateAlert();
      that.giveMeTweets(tweetsCallback, false, true);
      that.manager.newTweetsCallback = oldCallback;
    }
    this.fetchNewTweets(onFinishCallback);
    return;
  }
  if (cacheOnly && !this.firstRun){
    if (this.currentScroll == 0){
      this.cleanUpCache();
    }
    callback(this.tweetsCache, this.timelineId);
    return;
  }

  this.currentCallback = callback;
  var maxId = null;
  if (this.tweetsCache.length > 0){
    maxId = this.tweetsCache[this.tweetsCache.length - 1].id
  }
  //console.log("maxId",maxId)
  var context = {
    usingMaxId: !!maxId
  }
  var that = this;
  this.manager.ffBackend.timeline(this.timelinePath, function(success, tweets, status, context){
    that.onFetch.call(that, success, tweets, status, context) 
  }, context, OptionsBackend.get("tweets_per_page"), null, null, maxId);
}

Timeline.prototype.cleanUpCache = function(){
  var len = this.tweetsCache.length;
  if (len <= OptionsBackend.get("max_cached_tweets")){
    return;
  }
  var _c = len - 1;
  for (; _c >= OptionsBackend.get("max_cached_tweets"); --_c){
    if (!this.manager.isTweetRead(this.tweetsCache[_c].id)){
      break;
    }
  }
  this.tweetsCache = this.tweetsCache.slice(0, _c + 1);
}

Timeline.prototype.updateNewTweets = function(){
  this.tweetsCache = this.newTweetsCache.concat(this.tweetsCache);
  this.newTweetsCache = [];
  this.unreadNotified = [];
}

Timeline.prototype.newTweetsCount = function(){
  var unreadCount = 0;
  for (var t = this.newTweetsCache.length - 1; t >=0 ; --t){
    if (!this.manager.isTweetRead(this.newTweetsCache[t].id)){
      ++unreadCount;
    }
  }
  return [this.newTweetsCache.length, unreadCount];
}
Timeline.prototype.getNewUnreadTweets = function(){
  var unreadNewList = [];
  for (var t = 0; t < this.newTweetsCache.length; ++t){
    unreadNewList.push(this.newTweetsCache[t]);
    this.unreadNotified[this.newTweetsCache[t].id] = true;
  }
  return unreadNewList;
}
