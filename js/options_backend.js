OptionsBackend = {
  defaultOptions : {
    home_refresh_interval: 90*1000,
    memtions_refresh_interval: 150 * 1000,
    dms_refresh_interval : 150 * 1000,
    tweets_per_page : 10,
    max_cached_tweets : 30,

    request_timeout : 6000,
    
    home_color : "#9c2e2e"
    //memtions_color : "",
    //dms_color : "#7f870b",
  },
  cachedOptions: null,
  optionsData: Persistence.options(),
  save: function(optionsMap, skipReload){
    this.optionsData.save(JSON.stringify(optionsMap));
    if (skipReload){
      return;
    }
    this.cachedOptions = this.load();
  },
  load:function(forceDefault){
      var map = $.extend(true, {}, this.defaultOptions);
      if (forceDefault){
        return map;
      }
      try{
        var parsedMap = JSON.parse(this.optionsData.val());
        if (parsedMap){
          $.extend(true, map, parsedMap);
        }
      }catch(e){ }
      return map;
  },
  saveOptions: function(option, value){
    if (this.cachedOptions == null){
      this.cachedOptions = this.load()
    }
    this.cachedOptions[option] = value;
    this.save(this.cachedOptions, true);
  },
  get: function(option){
    if (this.cachedOptions == null){
      this.cachedOptions = this.load();
    }
    return this.cachedOptions[option];
  }
}
