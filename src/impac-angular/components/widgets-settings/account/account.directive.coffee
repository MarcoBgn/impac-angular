module = angular.module('impac.components.widgets-settings.account',[])

module.controller('SettingAccountCtrl', ($scope, $filter) ->

  w = $scope.parentWidget

  # What will be passed to parentWidget
  setting = {}
  setting.key = "account"
  setting.isInitialized = false

  # initialization of time range parameters from widget.content.hist_parameters
  setting.initialize = ->
    w.selectedAccount = null
    if w.content? && w.content.account_list? && w.metadata? && w.metadata.account_uid?
      w.selectedAccount = _.find(w.content.account_list, (acc) ->
        acc.uid == w.metadata.account_uid
      )
      setting.isInitialized = true

  setting.toMetadata = ->
    return { account_uid: w.selectedAccount.uid } if w.selectedAccount?

  $scope.formatAmount = (anAccount) ->
    return $filter('mnoCurrency')(anAccount.current_balance,anAccount.currency)

  w.settings ||= []
  w.settings.push(setting)
)

module.directive('settingAccount', ($templateCache) ->
  return {
    restrict: 'A',
    scope: {
      parentWidget: '='
    },
    template: $templateCache.get('widgets-settings/account.tmpl.html'),
    controller: 'SettingAccountCtrl'
  }
)
