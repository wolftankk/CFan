Persistence = {
  load:function(key){
    return new ValueWrapper(key);
  },
  isObject : function(key){
    return !!this.objectKeys[key];
  },
  addObject: function(key){
    this.objectKeys[key] = true,
    this.objectKeysVar.save(this.objectKeys);
  },

  init: function(){
    this.objectKeys = {'object_keys' : true};
    this.objectKeysVar = this.load('object_keys');
    this.objectKeys = this.objectKeysVar.val() || {};

    var existingKeys = ["options", "selected_lists", "timeline_order", "username", "password", "remember", "logged", "version", "popup_size", "window_position"];

    var that = this;
    for (var c = 0, len=existingKeys.length; c < len; ++c){
      var currKey = existingKeys[c];
      var methodName = currKey.replace(/_(\w)/g, function(m1, m2) { return m2.toUpperCase();});
      this[methodName] = (function(key){
        return function(){
          return that.load(key);
        }
      })(currKey)
    }
  },
}

function ValueWrapper(key){
  this.key = key
}
ValueWrapper.prototype = {
  save: function(value) {
    if((typeof value) != 'string') {
      if(!Persistence.isObject(this.key)) {
        Persistence.addObject(this.key);
      }
      value = JSON.stringify(value);
    }
    localStorage[this.key] = value;
    return value;
  },
  val: function() {
    var value = localStorage[this.key];
    if(!value) {
      return undefined;
    }
    if(Persistence.isObject(this.key)) {
      value = JSON.parse(value);
    }
    return value;
  },
  remove: function() {
    return localStorage.removeItem(this.key);
  }
}
Persistence.init();
