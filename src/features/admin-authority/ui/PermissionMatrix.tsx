import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Label } from "@/shared/ui/shadcn/label";
import { Authority } from "@/features/admin-authority/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface PermissionMatrixProps {
  authorities: Authority[];
  selectedAuthorityIds: string[];
  onToggleAuthority: (authorityId: string, checked: boolean) => void;
  onToggleGroup?: (authorityIds: string[], checked: boolean) => void;
  disabled?: boolean;
}

const PermissionMatrix = ({ authorities, selectedAuthorityIds, onToggleAuthority, onToggleGroup, disabled = false }: PermissionMatrixProps) => {
  const { t } = useTranslation('admin');

  const groupedAuthorities = useMemo(() => {
    const groups: { [key: string]: Authority[] } = {};
    if (!authorities || !Array.isArray(authorities)) {
      return groups;
    }
    authorities.forEach(auth => {
      if (!auth || !auth.resource) return;
      if (!groups[auth.resource]) {
        groups[auth.resource] = [];
      }
      groups[auth.resource].push(auth);
    });
    return groups;
  }, [authorities]);

  const hasAuthorities = Object.keys(groupedAuthorities).length > 0;

  return (
    <div className="space-y-6">
      {hasAuthorities ? (
        Object.entries(groupedAuthorities).map(([group, groupAuths]) => {
          const allSelected = groupAuths.every(auth => selectedAuthorityIds?.includes(auth.code));
          const someSelected = groupAuths.some(auth => selectedAuthorityIds?.includes(auth.code));
          const isIndeterminate = someSelected && !allSelected;

          const handleToggleGroup = (checked: boolean) => {
            if (onToggleGroup) {
              onToggleGroup(groupAuths.map(a => a.code), checked);
            } else {
              groupAuths.forEach(auth => {
                // If we are checking all, and this one is not checked, check it.
                // If we are unchecking all, and this one is checked, uncheck it.
                const isCurrentlyChecked = selectedAuthorityIds?.includes(auth.code);
                if (checked && !isCurrentlyChecked) {
                  onToggleAuthority(auth.code, true);
                } else if (!checked && isCurrentlyChecked) {
                  onToggleAuthority(auth.code, false);
                }
              });
            }
          };

          return (
            <div key={group} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{group}</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`group-${group}`}
                    checked={allSelected || (isIndeterminate ? "indeterminate" : false)}
                    onCheckedChange={(checked) => handleToggleGroup(checked as boolean)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`group-${group}`} className="text-xs cursor-pointer">{t('authority.selectAll')}</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 min-[48rem]:grid-cols-2 min-[64rem]:grid-cols-3 gap-4">
                {groupAuths.map((auth) => (
                  <div key={auth.code} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted" onClick={() => !disabled && onToggleAuthority(auth.code, !selectedAuthorityIds?.includes(auth.code))}>
                    <Checkbox
                      id={auth.code}
                      checked={selectedAuthorityIds?.includes(auth.code) || false}
                      onCheckedChange={(checked) => onToggleAuthority(auth.code, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={disabled}
                      className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <Label
                        htmlFor={auth.code}
                        className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        {auth.name}
                      </Label>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {auth.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">{t('authority.noPermissions')}</p>
        </div>
      )}
    </div>
  );
};

export { PermissionMatrix };
