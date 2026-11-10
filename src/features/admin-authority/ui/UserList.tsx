import { Search, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/shared/ds/input";
import { List, ListButtonItem } from "@/shared/ds/list";
import { User } from "@/features/admin-authority/types";

interface UserListProps {
  users: User[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

const UserList = ({ users, selectedUserId, onSelectUser }: UserListProps) => {
  const { t } = useTranslation('admin');
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-x3 px-x4 pb-x2 pt-x3">
        <h3 className="m-0 flex items-center gap-x2 text-t5 font-bold text-fg-neutral">
          <UserIcon className="size-4" aria-hidden />
          {t('authority.users')}
        </h3>
        <Input
          aria-label={t('authority.searchUsers')}
          placeholder={t('authority.searchUsers')}
          prefixIcon={<Search />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          <List>
            {filteredUsers.map((user) => (
              <ListButtonItem
                key={user.id}
                title={<span className="[overflow-wrap:anywhere]">{user.name}</span>}
                detail={<span className="[overflow-wrap:anywhere]">{user.email}</span>}
                highlighted={selectedUserId === user.id}
                aria-current={selectedUserId === user.id || undefined}
                onClick={() => onSelectUser(user.id)}
              />
            ))}
          </List>
        ) : (
          <div className="p-x4 text-center text-t4 text-fg-neutral-muted">
            {t('authority.noUsersFound')}
          </div>
        )}
      </div>
    </div>
  );
};

export { UserList };
