/* --- by Kurenov Olzhas --- */
/*global angular*/
var autocompleteApp = angular.module('autocomplete', []);

autocompleteApp.directive('autocomplete', function($state, $translate) {
  var index = -1;

  return {
    restrict: 'E',
    scope: {
      searchParam: '=ngModel',
      suggestions: '=data',
      onType: '=onType',
      onSelect: '=onSelect',
      autocompleteRequired: '='
    },
    controller: ['$scope', function($scope){
      // the index of the suggestions that's currently selected
      $scope.selectedIndex = -1;
      $scope.searchParam = '';

      $scope.initLock = true;

      // set new index
      $scope.setIndex = function(i){
        $scope.selectedIndex = parseInt(i);
      };

      this.setIndex = function(i){
        $scope.setIndex(i);
        $scope.$apply();
      };

      $scope.getIndex = function(i){
        return $scope.selectedIndex;
      };

      // watches if the parameter filter should be changed
      var watching = true;

      // autocompleting drop down on/off
      $scope.completing = false;

      // starts autocompleting on typing in something
      $scope.$watch('searchParam', function(newValue, oldValue){

        if (oldValue === newValue || (!oldValue && $scope.initLock)) {
          return;
        }

        if(watching && typeof $scope.searchParam !== 'undefined' && $scope.searchParam !== null) {
          $scope.completing = true;
          $scope.searchFilter = $scope.searchParam;
          $scope.selectedIndex = -1;
        }

        // function thats passed to on-type attribute gets executed
        if($scope.onType)
          $scope.onType($scope.searchParam);
      });

      // for hovering over suggestions
      this.preSelect = function(suggestion){

        watching = false;

        $scope.$apply();
        watching = true;

      };

      $scope.preSelect = this.preSelect;

      this.preSelectOff = function(){
        watching = true;
      };

      $scope.preSelectOff = this.preSelectOff;

      // selecting a suggestion with RIGHT ARROW or ENTER
      $scope.select = function(branch){
        if (branch) {
          $scope.$parent.$broadcast('selectedBranch', branch);
        }
        watching = false;
        $scope.completing = false;
        setTimeout(function(){watching = true;},1000);
        $scope.setIndex(-1);
      };

      $scope.refresh = function() {
        $scope.completing = true;
        $scope.searchFilter = $scope.searchParam;
        $scope.selectedIndex = -1;
      }


    }],
    link: function(scope, element, attrs){

      setTimeout(function() {
        scope.initLock = false;
        scope.$apply();
      }, 250);

      var attr = '';

      // Default atts
      scope.attrs = {
        "placeholder": $translate.instant('branchesFilterPlaceholder'),
        "class": "",
        "id": "",
        "inputclass": "",
        "inputid": ""
      };

      for (var a in attrs) {
        attr = a.replace('attr', '').toLowerCase();
        // add attribute overriding defaults
        // and preventing duplication
        if (a.indexOf('attr') === 0) {
          scope.attrs[attr] = attrs[a];
        }
      }

      if (attrs.clickActivation) {
        element[0].onclick = function(e){
          if(!scope.searchParam){
            setTimeout(function() {
              scope.completing = true;
              scope.$apply();
            }, 200);
          }
        };
      }

      var key = {left: 37, up: 38, right: 39, down: 40 , enter: 13, esc: 27, tab: 9};

      document.addEventListener("keydown", function(e){
        var keycode = e.keyCode || e.which;

        switch (keycode){
          case key.esc:
            // disable suggestions on escape
            scope.select();
            scope.setIndex(-1);
            scope.$apply();
            e.preventDefault();
        }
      }, true);

      document.addEventListener("blur", function(e){
        // disable suggestions on blur
        // we do a timeout to prevent hiding it before a click event is registered
        setTimeout(function() {
          scope.select();
          scope.setIndex(-1);
          scope.$apply();
        }, 150);
      }, true);

      //document.addEventListener("focus", function(e){
      //  $scope.completing = true;
      //  $scope.searchFilter = $scope.searchParam;
      //  $scope.selectedIndex = -1;
      //});


      element[0].addEventListener("keydown",function (e){
        var keycode = e.keyCode || e.which;

        var l = angular.element(this).find('li').length;

        // this allows submitting forms by pressing Enter in the autocompleted field
        if(!scope.completing || l == 0) return;

        // implementation of the up and down movement in the list of suggestions
        switch (keycode){
          case key.up:

            index = scope.getIndex()-1;
            if(index<-1){
              index = l-1;
            } else if (index >= l ){
              index = -1;
              scope.setIndex(index);
              scope.preSelectOff();
              break;
            }
            scope.setIndex(index);

            if(index!==-1)
              scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

            scope.$apply();

            break;
          case key.down:
            index = scope.getIndex()+1;
            if(index<-1){
              index = l-1;
            } else if (index >= l ){
              index = -1;
              scope.setIndex(index);
              scope.preSelectOff();
              scope.$apply();
              break;
            }
            scope.setIndex(index);

            if(index!==-1)
              scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

            break;
          case key.left:
            break;
          case key.right:
          case key.enter:
          case key.tab:

            index = scope.getIndex();
            // scope.preSelectOff();
            if(index !== -1) {
              //scope.select(angular.element(angular.element(this).find('li')[index]).text());
              if(keycode == key.enter) {
                e.preventDefault();
              }
            } else {
              if(keycode == key.enter) {
                //scope.select();
              }
            }
            scope.setIndex(-1);
            scope.$apply();

            break;
          case key.esc:
            // disable suggestions on escape
            scope.select();
            scope.setIndex(-1);
            scope.$apply();
            e.preventDefault();
            break;
          default:
            return;
        }

      });
    },
    template: '\
        <div class="autocomplete {{ attrs.class }}" id="{{ attrs.id }}">\
          <input\
            type="text"\
            ng-model="searchParam"\
            ng-click="refresh()"\
            placeholder="{{ attrs.placeholder }}"\
            class="{{ attrs.inputclass }}"\
            id="{{ attrs.inputid }}"\
            ng-required="{{ autocompleteRequired }}" />\
          <ul ng-show="completing && (suggestions | filter:searchFilter).length > 0">\
            <li\
              suggestion\
              ng-repeat="suggestion in suggestions | filter:searchFilter | orderBy:\'suggestion.name\' track by $index"\
              index="{{ $index }}"\
              ng-class="{ active: ($index === selectedIndex) }"\
              ng-click="select(suggestion)"\
              ng-bind-html="suggestion | highlight:searchParam">\
              </li>\
          </ul>\
        </div>'
  };
});

autocompleteApp.filter('highlight', ['$sce', function ($sce) {
  return function (originalInput, searchParam) {
    var input = angular.copy(originalInput);
    if (typeof input === 'function') return '';
    if (searchParam) {
      var wordsArray = searchParam.split(/\s/);
      var words = '(' + wordsArray.join('|') + ')';
      exp = new RegExp(words, 'gi');
      if (wordsArray.length) {
        if (input.name) {
          input.name = input.name.replace(exp, "<span class=\"bold\">$1</span>");
        }
        if (input.station) {
          input.station = input.station.replace(exp, "<span class=\"highlight\">$1</span>");
        }
        if (input.address) {
          input.address = input.address.replace(exp, "<span class=\"highlight\">$1</span>");
        }
      }
    }
    var row2 = input.station ? '<span class="autocomplete-small-text">' + input.station + '</span>' : '';
    var row3 = input.address ? '<span class="autocomplete-small-text">' + input.address + '</span>' : '';
    if (row2 && row3) {
      row2 += '<br/>';
    }
    return $sce.trustAsHtml('<p>' +input.name + '</p>' + row2 + row3);
  };
}]);

autocompleteApp.filter('branchfilter', ['$sce', function ($sce) {
  return function (branches, searchParam) {
    //if (!searchParam) {
    //  return branches;
    //}
    var out = [];
    angular.forEach(branches, function(branch) {
      if (branch.name && branch.name.indexOf(searchParam) >= 0) {
        out.push(branch);
      }
    });
    return out;
  };
}]);

//autocompleteApp.directive('suggestion', function(){
//  return {
//    restrict: 'A',
//    require: '^autocomplete', // ^look for controller on parents element
//    link: function(scope, element, attrs, autoCtrl){
//      element.bind('mouseenter', function() {
//        autoCtrl.preSelect(attrs.val);
//        autoCtrl.setIndex(attrs.index);
//      });
//
//      element.bind('mouseleave', function() {
//        autoCtrl.preSelectOff();
//      });
//    }
//  };
//});
