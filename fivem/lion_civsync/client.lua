RegisterNetEvent('lion_civsync:notification', function(group)
    if type(group) ~= 'string' then return end
    local label = Config.GroupLabels[group] or group
    local description = group == 'user'
        and 'Civilní oprávnění ti byla odebrána. Tvoje skupina byla změněna na User.'
        or ('Tvoje civilní skupina byla změněna na %s. Změna platí pro všechny postavy.'):format(label)

    lib.notify({
        title = 'Civilian Permissions',
        description = description,
        type = 'inform',
        icon = 'user-shield',
        iconColor = '#3b82f6',
        duration = 7500
    })
end)
