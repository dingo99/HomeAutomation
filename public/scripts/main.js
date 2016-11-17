myApp = angular.module('myApp', []);

myApp.controller('mainController', function($scope, $http, $timeout) {
        var getWeather = function() {
            var url = 'http://api.wunderground.com/api/7e82a734942106e1/geolookup/conditions/q/IA/conshohocken.json';
            $http({
              method: 'GET',
              url: url
            }).then(function successCallback(response) {
              $scope.weatherData = response.data.current_observation;
              // this callback will be called asynchronously
              // when the response is available
  //            alert($scope.weatherData.weather);
            }, function errorCallback(response) {
              // called asynchronously if an error occurs
              // or server returns response with an error status.
            });
        }
        getWeather();
//        alert("gotten");
});

