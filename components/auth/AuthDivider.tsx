type AuthDividerProps = {
  label?: string;
};

const AuthDivider = ({ label = "or" }: AuthDividerProps) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-surface-200 dark:border-dark-border" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-3 bg-white dark:bg-dark-card text-surface-500 dark:text-surface-400">
        {label}
      </span>
    </div>
  </div>
);

export default AuthDivider;
