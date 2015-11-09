var appAngular = angular.module('App', ['ngMaterial', 'ngRoute', 'LocalStorageModule', 'ngMessages', 'ngTouch']);

'use strict';
appAngular.factory('authInterceptorService', ['$q', '$location', 'localStorageService',
    function ($q, $location, localStorageService) {

        var authInterceptorServiceFactory = {};
        
    var _request = function (config) {        
        config.headers = config.headers || {};

        var authData = localStorageService.get('authorizationData');
        if (authData) {
            config.headers.Authorization = 'Bearer ' + authData.token;
        }

        return config;
    }

    var _responseError = function (rejection) {

        var authData = localStorageService.get('authorizationData');
        
        if (authData) {           
            if (rejection.status === 401) {
                $location.path('/unauthorized');
            }
        } else {
            $location.path('/login');
        }
        
        return $q.reject(rejection);
    }

    authInterceptorServiceFactory.request = _request;
    authInterceptorServiceFactory.responseError = _responseError;

    return authInterceptorServiceFactory;
    
}]);

appAngular.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan', {
      'default': '500', // by default use shade 400 from the pink palette for primary intentions
      
    })
    // If you specify less than all of the keys, it will inherit from the
    // default shades
    .accentPalette('indigo');
});

appAngular.config(function($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider
   .when('/', {
    templateUrl: 'tpl/home.html',
    controller: 'HomeController',
    resolve: {
      // I will cause a 1 second delay
      delay: function($q, $timeout) {
        var delay = $q.defer();
        $timeout(delay.resolve, 1000);
        return delay.promise;
      }
    }
  })
  .when('/login', {
    templateUrl: 'tpl/login.html',
    controller: 'LoginController'
  })
  .when('/new', {
    templateUrl: 'tpl/form.html',
    controller: 'FormController'
  })
  .when('/edit', {
    templateUrl: 'tpl/form.html',
    controller: 'FormController'
  }).when('/newPacient', {
    templateUrl: 'tpl/form.html',
    controller: 'NewPacienteController'
  }); 
  
   $routeProvider.otherwise({ redirectTo: "/" });
   
   $httpProvider.interceptors.push('authInterceptorService');

  // configure html5 to get links working on jsfiddle
   //$locationProvider.html5Mode(true);
});


'use strict';
appAngular.factory('authService', ['$http', '$q', '$mdDialog', 'localStorageService', '$location',
    function ($http, $q, $mdDialog, localStorageService, $location) {

    var serviceBase = 'http://administracion.os-position.com:8040/';
    
    var authServiceFactory = {};

    var _authentication = {
        isAuth: false,
        userName: ""
    };

    var _getList = function (url, data) {
        
        data = typeof data == "undefined" ? data : {};
        return $http.get(serviceBase + url, data);
    }

    var _registerAccount = function (registration) {

        //_logOut();
        return $http.post(serviceBase + 'api/Account/Register/', registration);

    };

    var _post = function (url, data) {

        return $http.post(serviceBase + url, data);

    };

    var _edit = function (url, data) {

        return $http.post(serviceBase + url, data);

    };

    var _delete = function (url, data) {

        return $http.post(serviceBase + url, data);

    };

    var _get = function (url, data) {

        return $http({
            method: 'GET',
            url: serviceBase + url,
            params: data
        });

    };
   

    var _login = function (loginData) {

        var data = "grant_type=password&username=" + loginData.userName + "&password=" + loginData.password;

        return $http.post(serviceBase + 'Token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (response) {
            
            localStorageService.set('authorizationData', { token: response.access_token, userName: loginData.userName });           
            localStorageService.set('roleUser', response.role);
            _authentication.isAuth = true;
            _authentication.userName = loginData.userName;
            _authentication.role = response.role;

        }).error(function (err, status) {
            _logOut();
        });


    };

    var _logOut = function () {

        var authData = localStorageService.get("authorizationData");
        
        if (authData) {
            $http.post(serviceBase + 'api/Account/Logout').then(function () {
                localStorageService.remove('authorizationData');
                localStorageService.remove('roleUser');
                _authentication.isAuth = false;
                _authentication.userName = "";
                _authentication.role = "";
            });
        }
        $location.path('/login');

    };

    var _fillAuthData = function () {

        
        var authData = localStorageService.get("authorizationData");
        
        if (authData) {
            _authentication.isAuth = true;
            _authentication.userName = authData.userName;
            _authentication.role = localStorageService.get("roleUser");
            
            $http.get(serviceBase + 'api/Account/RoleUser').then(function (results) {
                
                localStorageService.set('roleUser', results["data"]);
            });
            
        }

    }
    
    var _authenticated = function(){
        
        $http.get(serviceBase + 'api/Account/RoleUser').then(function (results) {                
            localStorageService.set('roleUser', results["data"]);
        });
    }

    var _showMessage = function (ev, msg) {
        $mdDialog.show(
            $mdDialog.alert()
               .title('Mensaje')
               .content(msg)
               .ariaLabel('Mensaje')
               .ok('OK')
               .clickOutsideToClose(true)
               .parent(angular.element(document.body))
               .targetEvent(ev)
        );
    };

    authServiceFactory.registrationAccount = _registerAccount;
    authServiceFactory.login = _login;
    authServiceFactory.logOut = _logOut;
    authServiceFactory.fillAuthData = _fillAuthData;
    authServiceFactory.authentication = _authentication;
    authServiceFactory.getList = _getList;
    authServiceFactory.delete = _delete;
    authServiceFactory.edit = _edit;
    authServiceFactory.post = _post;
    authServiceFactory.get = _get;
    authServiceFactory.showMessage = _showMessage;
    authServiceFactory.authenticated =_authenticated;
    
    return authServiceFactory;
}]);

appAngular.run(['authService', function (authService) {
    authService.fillAuthData();
}]);

appAngular.controller('IndexController', ['$scope', '$timeout', '$mdSidenav', '$mdUtil', 'authService',
  function($scope, $timeout, $mdSidenav, $mdUtil, authService){   
    
    $scope.closeSide = function () {
      $mdSidenav('left').toggle();
    };
    
    $scope.openSide = function () {
      $mdSidenav('left').toggle();
    };
    
    $scope.authentication = authService.authentication;
    
    $scope.$watch('authentication.isAuth', function(value){        
        if (!value){
            $scope.closeSide();
        }
    });
 
}]);


appAngular.controller('LoginController', ['$scope', '$timeout', 'authService', '$location',
  function($scope, $timeout, authService, $location){
      
      $scope.submitForm = function($event){
        authService.login($scope.user).then(function (response) {          
            $location.path('/');
        }, function (error) {           
            authService.showMessage($event, error["data"]["error_description"]);
        });
    };
 
}]);

appAngular.controller('NewPacienteController', ['$scope', 'authService', '$location', '$q', 'pacienteService',
    function($scope, authService, $location, $q, pacienteService){
        
        $scope.back = function(){
             $location.path('/');
        };
        
        var infoUser = pacienteService.getModel();
        $scope.model = {};
        $scope.label = "Registrar";
        
        var getModel = function(){
            
            $scope.model.Name = infoUser.nombre;
            $scope.model.LastName = infoUser.apellido;
            $scope.model.Nit = infoUser.cedula;
            $scope.model.RH = infoUser.rh;
            $scope.model.Gender = infoUser.sexo;
            console.log(infoUser.nacimiento)
            //$scope.model.BirthFecha = infoUser.nacimiento;    
        }
        
        getModel();
        
        $scope.submitForm = function($event){
            
            var url = 'api/Pacientes';
            var msg = "Paciente registrado exitosamente"; 
            $scope.model.BirthDate = new Date(new Date($scope.model.BirthFecha).setHours(0, 0, 0, 0));
            authService.post(url, $scope.model).then(function (response) {          
               authService.showMessage($event, msg);
            }, function (error) {           
                authService.showMessage($event, error["data"]["error_description"]);
            });
            
        };
  
  }]); 
  
appAngular.controller('FormController', ['$scope', 'authService', '$location', '$q', 'pacienteService',
    function($scope, authService, $location, $q, pacienteService){
        
        $scope.back = function(){
             $location.path('/');
        };
        $scope.model = {};
        $scope.action = pacienteService.getMethod();
        $scope.label = "";
        var getModel = function(){
            
            if ($scope.action == "edit"){
                $scope.label = "Actualizar";            
                $scope.model = pacienteService.getModel();
                $scope.model.Contact = parseInt($scope.model.Contact);
                $scope.model.Nit = parseInt($scope.model.Nit);
                $scope.model.PhoneNumber = parseInt($scope.model.PhoneNumber);
                $scope.model.BirthFecha = new Date($scope.model.BirthDate);
                //console.log($scope.model);
            }else if($scope.action == 'new') {
                 $scope.label = "Registrar";
            }else{
                 $location.path('/');
            }
        }
        getModel();
        
        $scope.submitForm = function($event){
            var url = "";
            var msg = "";
            if ($scope.action == "edit"){
               url = 'api/Pacientes/Edit';
               msg = "Paciente actualizado exitosamente";
            }else{
               url = 'api/Pacientes';
               msg = "Paciente registrado exitosamente"; 
            }
            
            $scope.model.BirthDate = new Date(new Date($scope.model.BirthFecha).setHours(0, 0, 0, 0));
            authService.post(url, $scope.model).then(function (response) {          
               authService.showMessage($event, msg);
            }, function (error) {           
                authService.showMessage($event, error["data"]["Message"]);
            });
            
        };
        
      
  
  }]); 
       
appAngular.controller('HomeController', ['$scope', 'authService', '$location', '$q', 'pacienteService',
    function($scope, authService, $location, $q, pacienteService){
  
    authService.authenticated();
    $scope.paciente = null;
    
    $scope.simulateQuery = false;
    $scope.isDisabled    = false;
    $scope.selectedItemChange = selectedItemChange;
    $scope.searchTextChange   = searchTextChange;
    
     $scope.queryFilter = {
        value: ""
    };
    
    $scope.querySearch = function (query) {

        var def = $q.defer();
        $scope.queryFilter.value = query;

        authService.post("api/Pacientes/Consult/", $scope.queryFilter).success(function (response) {
            $scope.pacientes = response;
            def.resolve(response);
        }).error(function () {
            def.reject("Fallo para obtener la lista de pacientes");
        });

        return def.promise;
    };

    function searchTextChange(text) { }

    function selectedItemChange(item) {
      if (typeof item != "undefined") {
            getPaciente(item.Id);
            $("body").animate({scrollTop: 300}, "slow");
        } else {
            $scope.paciente = null;
        }
    }
    
    var getPaciente = function(pk){
       
        authService.get("api/Pacientes/" + pk).then(function(response){
            $scope.paciente = response["data"];
            $scope.paciente.BirthFecha = new Date($scope.paciente.BirthDate);
            $scope.paciente.birthYear = getBirthYear($scope.paciente.BirthDate);
            //console.log(response["data"]);
        });
    }
    
    var getBirthYear = function (birthDate) {
        var birthYear = new Date().getFullYear() - new Date(birthDate).getFullYear();
        if (new Date().getMonth() < new Date(birthDate).getMonth()) {
            birthYear -= 1;               
        } else if (new Date().getMonth() === new Date(birthDate).getMonth()) {
            if (new Date().getDate() < new Date(birthDate).getDate()) {
                birthYear -= 1;
            }
        }
        return birthYear;
    }
        
    $scope.newItem = function(){
        pacienteService.setMethod("new");
        $location.path('/new');
    }
    
    $scope.editItem = function(){
        pacienteService.setModel($scope.paciente);
        pacienteService.setMethod("edit");
        $location.path('/edit');
    }
    
    $scope.infoUser = {};
    $scope.isNotUser = false;
    
    /**
    * Scan these barcode types
    * Available: "PDF417", "USDL", "QR Code", "Code 128", "Code 39", "EAN 13", "EAN 8", "ITF", "UPCA", "UPCE", "Aztec", "Data Matrix"
    */
    var types = ["PDF417", "QR Code"];

    /**
        * Initiate scan with options
        * NOTE: Some features are unavailable without a license
        * Obtain your key at http://pdf417.mobi
        */
    var options = {
        beep : true,  // Beep on
        noDialog : true, // Skip confirm dialog after scan
        uncertain : false, //Recommended
        quietZone : false, //Recommended
        highRes : false, //Recommended
        inverseScanning: false,
        frontFace : false
    };

    // Note that each platform requires its own license key

    // This license key allows setting overlay views for this application ID: mobi.pdf417.demo
    var licenseiOs = "XE3DN5MH-6BYS3TA7-HAUQHBDD-NRKVH4DV-WPDPF4NF-6PAUBFXW-IYVZBUX7-CXNQ4P7Z";

    // This license is only valid for package name "mobi.pdf417.demo"
    var licenseAndroid = "UDPICR2T-RA2LGTSD-YTEONPSJ-LE4WWOWC-5ICAIBAE-AQCAIBAE-AQCAIBAE-AQCFKMFM";
    
    var hex2a = function(hex) {
        var str = '';
        for (var i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }
    
    $scope.updateInfo = function(){
        
        $scope.paciente = null;
        
        cordova.plugins.pdf417Scanner.scan(
        
            // Register the callback handler
            function callback(scanningResult) {
                $scope.infoUser = {};
                // handle cancelled scanning
                if (scanningResult.cancelled == true) {
                    $scope.infoUser = "Cancelled!";
                    return;
                }
                
                // Obtain list of recognizer results
                var resultList = scanningResult.resultList;
                // Iterate through all results
                for (var i = 0; i < resultList.length; i++) {
                    
                    // Get individual resilt
                    var recognizerResult = resultList[i];
                    if (recognizerResult.resultType == "Barcode result") {
                        // handle Barcode scanning result

                        var raw = "";
                        if (typeof(recognizerResult.raw) != "undefined" && recognizerResult.raw != null) {
                            raw = " (raw: " + hex2a(recognizerResult.raw) + ")";
                        }
                        var values = [];                        
                        
                        var result = recognizerResult.data.split(" ");
                        
                        if (result.length < 10){
                            getDatos(result[0]);
                        }
                        else{
                            angular.forEach(result, function(value, key){
                                if (value != ""){
                                    values.push(value);
                                }
                            });
                           
                            getData(values);
                            
                        }
                        console.log($scope.infoUser);
                        consultarPaciente($scope.infoUser["cedula"]);
                        
                    }
                }
            },
            
            // Register the error callback
            function errorHandler(err) {
                alert('Error: ' + err);
            },

            types, options, licenseiOs, licenseAndroid
        );
    };
    
    var consultarPaciente = function(cedula){
        
        authService.post("api/Pacientes/Consultar/",  {
            Value: cedula
        })
        .then(function (response) {
            $scope.isNotUser = false;           
            $scope.paciente = response["data"];
            $scope.paciente.BirthFecha = new Date($scope.paciente.BirthDate);
            $scope.paciente.birthYear = getBirthYear($scope.paciente.BirthDate);
            $("body").animate({scrollTop: 300}, "slow");
            
        }, function (response, status) {           
            $scope.isNotUser = true;
            //console.log(status);
        });
    }
    
    $scope.closeCardInfo = function(){
        $scope.paciente = null;
    }
   
    var getData = function(values){
        $scope.infoUser["cedula"] = parseInt(values[2].substring(8, 18));
        $scope.infoUser["apellido"] = values[2].substring(18, values[2].length) + " " + values[3];
        
        if (values[5].match(/[0-9]/g) == null){
            $scope.infoUser["nombre"] = values[4] + " " + values[5];
            $scope.infoUser["sexo"] = values[6].substring(1, 2);
            $scope.infoUser["rh"] = values[6].substring(values[6].length-2, values[6].length);
            $scope.infoUser["nacimiento"] = parseInt(values[6].substring(2, 10));            
        }else{
            $scope.infoUser["nombre"] = values[4];
            $scope.infoUser["sexo"] = values[5].substring(1, 2);
            $scope.infoUser["rh"] = values[5].substring(values[5].length-2, values[5].length);
            $scope.infoUser["nacimiento"] = parseInt(values[5].substring(2, 10));
        }
        
    }
    var index = 0;
    var subSrt = [];
    var partialNit = "";
    
    var getDatos = function(str){
        
        $scope.infoUser["apellido"] =  "";
        $scope.infoUser["nombre"] = "";
        if (str.indexOf("0M") != -1){
            
            subSrt = str.split("PubDSK_");
            str = (subSrt[1].toString());
            
            index = str.indexOf("0M");    
                     
            $scope.infoUser["sexo"] = str.substring(index+1, index+2);
            $scope.infoUser["rh"] = str.substring(index+16, index+18);
            $scope.infoUser["nacimiento"] = parseInt(str.substring(index+2, index+10));
            
            partialNit =  (str.substring(0, index)).replace(/\D/g, '');
            $scope.infoUser["cedula"] = parseInt( partialNit.substring(partialNit.length - 10, partialNit.length) );
            $scope.infoUser["nombres"] = (str.substring(0, index)).replace(/[0-9]/g, '');
            
        }else{
            
            subSrt = str.split("PubDSK_");
            str = (subSrt[1].toString());
            
            index = str.indexOf("0F");    
                     
            $scope.infoUser["sexo"] = str.substring(index+1, index+2);
            $scope.infoUser["rh"] = str.substring(index+16, index+18);
            $scope.infoUser["nacimiento"] = parseInt(str.substring(index+2, index+10));
            
            partialNit =  (str.substring(0, index)).replace(/\D/g, '');
            $scope.infoUser["cedula"] = parseInt( partialNit.substring(partialNit.length - 10, partialNit.length) );
            $scope.infoUser["nombres"] = (str.substring(0, index)).replace(/[0-9]/g, '');
            
        }        
    }
    
    $scope.addPaciente = function(){
        pacienteService.setModel($scope.infoUser);
        $location.path('/newPacient');
    }
   
    //"1196078090052323721VIVASCARRANZAYHANIRA0F19760918150010O+2Cs[ÿekpad¨aR<Hl¥kµ«Ç\X¥V´RU®AF?Jz6^FwPX±m{³|¢U¥_k{Á}´r§8VwFÅs°£~ª|Xx©a±¡fµz·f¸¥£¥®ÆMmC^RIX^[foSo]y]|µ¤Ö¬þDS@âzTÿ7CVÿvo^U [Z^ÅHÆK<zJs¤S«[¶e»u¿JÃ§±gË¯Uoh`³AyW¡Dg6PRf4G_b[}Osdz_4RGspZGsZ¾®8¨É£¬Ô\Âc§Â¬²¤¿·Ë>QMjrl?rf[zÉÝ"IBùV©ÐßQÿqñ:5M!ålwä PTn½WYc[iuºð¸ö¦ó!"
    
}]);

appAngular.factory('pacienteService', function () {

    var objectModel = {};
    var method = "";

    var _setModel = function (data) {        
        objectModel = data;        
    }

    var _getModel = function () {
        return objectModel;
    }
    
    var _setMethod = function (metodo) {
        method = metodo;
    }
    
    var _getMethod = function () {
        return method;
    }

    return {
        setModel: _setModel,
        getModel: _getModel,
        setMethod: _setMethod,
        getMethod: _getMethod
    }

});


appAngular.directive('ngLogout', ['authService', function(authService) {

  function link(scope, element, attrs) {
    
    element.bind('click', function(){
        authService.logOut();
    });
  }

  return {
    link: link
  };
}]);


appAngular.directive("ngScroll", function ($window, $document) {
    return function(scope, element, attrs) {
        angular.element($window).bind("scroll", function() {  
            
            var offsetHeight = $document[0].all[37].offsetHeight;            
            if ((this.pageYOffset + this.innerHeight) >= offsetHeight) {               
               //element.css('bottom', '70px');
            }else{
                element.css('bottom', '10px');
            }
        });
    };
});

appAngular.directive("ngScrollUp", function ($window, $document, $timeout) {
    return function(scope, element, attrs) {
        
        angular.element($window).bind("scroll", function() { 
            if (this.pageYOffset >= 100) {               
               element.css('display', 'block');
            }else{
                element.css('display', 'none');
            }
            
            var offsetHeight = $document[0].all[37].offsetHeight;
            if ((this.pageYOffset + this.innerHeight) >= offsetHeight) {               
               //element.css('bottom', '70px');
            }else{
                element.css('bottom', '10px');
            }
        });
        
        element.bind("click", function() { 
            //$window.scrollTo(0, 0);            
             //$("body").animate({scrollTop: 0}, "slow");             
             scrollTo($document[0].body, 0, 400);
        });
        
        var scrollTo = function(element, to, duration) {
          if (duration < 0) return;
          var difference = to - element.scrollTop;
          var perTick = difference / duration * 10;
        
          $timeout(function() {
            element.scrollTop = element.scrollTop + perTick;
            if (element.scrollTop == to) return;
            scrollTo(element, to, duration - 10);
          }, 10);
        }
        
    };
});


appAngular.directive('uniqueField', ["$http", function ($http) {
        var inputChangedPromise;
        return {
            require: ['ngModel'],
            restrict: 'A',
            link: function (scope, elem, attrs, crtl) {
                elem.on('keyup', function (evt) {
                    
                    if(inputChangedPromise){
                        clearTimeout(inputChangedPromise);
                    }
                    inputChangedPromise = setTimeout( function (){
                        var data = {
                                field_value: elem.val()
                            };                        
                            
                        $http({
                            method: 'POST',
                            url: attrs['uniqueField'],
                            data: data
                        }).then(function(response){
                           console.log(response["data"]);
                        })
                    }, 1000);
                });
            }
        }
    }]);
