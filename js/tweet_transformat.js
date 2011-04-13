var FanfouLib = {
  URLS : {
    BASE: "http://fanfou.com/",
    API_HOST : "http://api2.fanfou.com/"
  }
}
var Renderer = {
  setContext : function(val){
    this.context = val;//desktop or onpage or popup
  },
  isDesktop : function(){
    return this.context == "desktop";
  },
  isOnPage : function(){
    return this.context = "onpage";
  },
  isPopup : function(){
    return this.context = "popup";
  },
  isNotification : function(){
    return this.context != "popup";
  },
  transformTweetText : function(text){

  },
  getTimestampAltText : function(time){
    var time = Date.parse(time);
    return new Date(time).getFullYear() + "-" + (new Date(time).getMonth() + 1) + "-" + new Date(time).getDay() + " " + new Date(time).toLocaleTimeString();
  },
  formatTime : function(time){
    var time = Date.parse(time);
    var now = new Date().getTime();
    var diff = (now - time) / 1000;
    if (diff < 15){
        return "刚刚发送";
    }else{
        if (diff < 60){
            return "1分钟前";
        }else{
            if (diff < 60 * 60){
                var mins = parseInt(diff / 60);
                return mins + "分钟前";
            }else{
              if (diff < 60 * 60 * 24){
                var hs = parseInt(diff / (60 * 60));
                return hs + "小时前";
              }else{
                if (diff < 60 * 60 * 24 *30){
                  var days = parseInt(diff / (60 * 60 * 24));
                  return days + "天前";
                }else{
                  if (diff < 60 * 60 * 24 * 30 * 12){
                    var mns = parseInt(diff / (60 * 60 * 24 * 30));
                    return mns + "月前";
                  }else{
                    return "很久很久以前";
                  }
                }
              }
            }
        }
    }
  },
  renderTweet: function(tweet){
    if (!tweet.user){
      tweet.user = tweet.sender
    }
    var user = tweet.user.id;
    var nickName = tweet.user.screen_name;
    var tweetId = tweet.id;
    var text = tweet.text;
    //if rtweet, user, text, tweetId replace real, but Fanfou hasn't
    //create main container for tweet
    var _container = $("<div id=tweet_"+tweetId+"></div>").addClass("tweet");
    //使用jQuery data 
    _container.data("tweet", tweet);//include tweet data info;
    
    //update text data
    var content = this.transformTweetText(text);

    
    //TODO:用户头像, 这里点击后会出现下拉菜单
    $("<img />").addClass("avatar").attr("src", tweet.user.profile_image_url).click(function(){
      openTab(FanfouLib.URLS.BASE + user);
    }).appendTo(_container);

    //add username
    var topinfo = $("<div />").height(16).appendTo(_container);
    $("<a />").attr("href", "javascript:;").addClass("user").text(nickName).click(function(){
     openTab(FanfouLib.URLS.BASE + user);
    }).appendTo(topinfo);

    if (!this.isNotification()){
        //饭否操作区
        var $actions = $("<div />").appendTo(topinfo).addClass("actions");
        $("<a />").html("<img src='images/reply.png' />  ").attr("title", "回复").click(function(){
          console.log(tweetId)
          Composer.reply(_container.data("tweet")); 
        }).appendTo($actions)
          
        //TODO:
        //$("<a />").html("<img src='images/dm.png' />  ").attr("title", "私信").appendTo($actions);
       
        //if dms, favorite = false
        if (tweet.favorited == false){//判断是否已经收藏了
          $("<a />").html("<img src='images/star_grey.png' id='favorite' />  ").attr("title", "收藏").appendTo($actions).click(function(){
            Composer.favorite(tweet, true);
          });
        }else if(tweet.favorited == true){
          $("<a />").html("<img src='images/star.png' id='favorite' />  ").attr("title", "取消收藏").appendTo($actions).click(function(){
            Composer.favorite(tweet, false);
          });
        }
        
        $("<a />").html("<img src='images/rt.png' />  ").attr("title", "转发").appendTo($actions).click(function(){
          Composer.retweet(_container.data("tweet"));
        });
        //判断消息是否是自己的
        if (tweet.user.id == localStorage.id){
          $("<a />").html("<img src='images/trash.gif' />  ").attr("title", "删除").appendTo($actions).click(function(){

            Composer.trash(_container.data("tweet"));
          });
        }
    }
    //主文字区
    //测试text中是否有http://fanfou.com/photo/(\w*)?
    var hasImage = false;
    if (text.match(/http\:\/\/fanfou.com\/photo\/(\w*)/)){
      hasImage = true;
    }
    $textview = $("<div />").addClass("text").html(text).appendTo(_container);
		$textview.find("a").each(function(){
			var href = $(this).attr("href");
			if (href.match(/^\/(\w*)\/(.*)/)){
				//href = /q/xxx
				href = FanfouLib.URLS.BASE + href.substr(1);
			}
			//console.log(href);
			$(this).click(function(){
				openTab(href);
			});
			$(this).attr("href", "javascript:;");
		});
    if (hasImage && tweet.photo){
      var img = $("<div />").appendTo(_container).addClass("photo_preview");
      //.attr({"title" : "点击查看大图", "href" : tweet.photo.largeurl}).
      $("<a />").append($("<img />").attr("src", tweet.photo.thumburl)).appendTo(img);
    }
    

    //显示回复内容区
    $("<div />").addClass("reply_msg_info").appendTo(_container);
    
    //cleanup
    $("<div />").addClass("clear").appendTo(_container);
    
    var footer = $("<div />").addClass("footer").appendTo(_container);
    var fleft = $("<div />").addClass("fleft").appendTo(footer)
    fleft.append($("<span />").addClass("timestamp").text(Renderer.formatTime(tweet.created_at)).attr("title", Renderer.getTimestampAltText(tweet.created_at)));

    //if have in_reply_to_status_id
    if (tweet.in_reply_to_status_id){
        //click show/hide msg info
        fleft.append($("<a />").addClass("in_reply_msg").text("查看回复").attr("href", "#").click(function(){
            Composer.showTweet(_container.data("tweet")); 
        }));
    }
    if (tweet.source){
      var fright = $("<div />").addClass("fromsource").appendTo(footer)
      fright.html("通过"+tweet.source);
      //location
    }
    $("<div />").addClass("clear").appendTo(_container);

    return _container
  }
}

function openTab(taburl){
  chrome.tabs.create({url : taburl}); 
}
