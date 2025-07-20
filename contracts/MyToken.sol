// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MyToken
 * @dev Advanced ERC20 Token with comprehensive tokenization features
 * Features:
 * - Mintable: Owner can mint new tokens
 * - Burnable: Token holders can burn their tokens
 * - Pausable: Owner can pause/unpause transfers
 * - Permit: EIP-2612 gasless approvals
 * - Access Control: Owner-based permissions
 * - Reentrancy Protection: Prevents reentrancy attacks
 * - Supply Cap: Maximum supply limit
 * - Transfer Fees: Optional transfer fees
 * - Vesting: Token vesting functionality
 * - Staking: Basic staking mechanism
 */
contract MyToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit, ReentrancyGuard {
    // Maximum supply cap
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    
    // Transfer fee (in basis points, 100 = 1%)
    uint256 public transferFee = 0; // 0% initially
    uint256 public constant MAX_TRANSFER_FEE = 500; // 5% maximum
    
    // Fee collection address
    address public feeCollector;
    
    // Minter role
    mapping(address => bool) public minters;
    
    // Blacklist functionality
    mapping(address => bool) public blacklisted;
    
    // Staking functionality
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 rewardDebt;
    }
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public stakingRewardRate = 100; // 1% per year (100 basis points)
    
    // Vesting functionality
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        bool revocable;
        bool revoked;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Events
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event TransferFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event AccountBlacklisted(address indexed account);
    event AccountUnblacklisted(address indexed account);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensVested(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
    
    // Modifiers
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not a minter");
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }
    
    constructor(
        uint256 initialSupply,
        address initialOwner
    ) ERC20("Advanced MyToken", "AMTK") ERC20Permit("Advanced MyToken") Ownable(initialOwner) {
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");
        _mint(initialOwner, initialSupply);
        feeCollector = initialOwner;
    }
    
    /**
     * @dev Allow contract to receive ETH for emergency testing
     */
    receive() external payable {}
    fallback() external payable {}
    
    /**
     * @dev Mint new tokens (only minters)
     */
    function mint(address to, uint256 amount) public onlyMinter notBlacklisted(to) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Batch mint to multiple addresses
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyMinter 
    {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(!blacklisted[recipients[i]], "Recipient is blacklisted");
            _mint(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Add/remove minter
     */
    function addMinter(address account) external onlyOwner {
        minters[account] = true;
        emit MinterAdded(account);
    }
    
    function removeMinter(address account) external onlyOwner {
        minters[account] = false;
        emit MinterRemoved(account);
    }
    
    /**
     * @dev Update transfer fee
     */
    function setTransferFee(uint256 _transferFee) external onlyOwner {
        require(_transferFee <= MAX_TRANSFER_FEE, "Fee too high");
        uint256 oldFee = transferFee;
        transferFee = _transferFee;
        emit TransferFeeUpdated(oldFee, _transferFee);
    }
    
    /**
     * @dev Update fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }
    
    /**
     * @dev Blacklist functionality
     */
    function blacklistAccount(address account) external onlyOwner {
        blacklisted[account] = true;
        emit AccountBlacklisted(account);
    }
    
    function unblacklistAccount(address account) external onlyOwner {
        blacklisted[account] = false;
        emit AccountUnblacklisted(account);
    }
    
    /**
     * @dev Pause/unpause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Staking functionality
     */
    function stake(uint256 amount) external nonReentrant notBlacklisted(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // If user already has stake, calculate and add pending rewards
        if (stakes[msg.sender].amount > 0) {
            uint256 pendingReward = calculateStakingReward(msg.sender);
            if (pendingReward > 0) {
                stakes[msg.sender].rewardDebt += pendingReward;
            }
        }
        
        _transfer(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].startTime = block.timestamp;
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        uint256 reward = calculateStakingReward(msg.sender);
        reward += stakes[msg.sender].rewardDebt;
        
        stakes[msg.sender].amount -= amount;
        stakes[msg.sender].startTime = block.timestamp;
        stakes[msg.sender].rewardDebt = 0;
        totalStaked -= amount;
        
        // Transfer staked tokens back
        _transfer(address(this), msg.sender, amount);
        
        // Mint reward tokens if any
        if (reward > 0 && totalSupply() + reward <= MAX_SUPPLY) {
            _mint(msg.sender, reward);
        }
        
        emit TokensUnstaked(msg.sender, amount, reward);
    }
    
    function calculateStakingReward(address user) public view returns (uint256) {
        if (stakes[user].amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - stakes[user].startTime;
        uint256 reward = (stakes[user].amount * stakingRewardRate * stakingDuration) / (365 days * 10000);
        
        return reward;
    }
    
    function setStakingRewardRate(uint256 _rate) external onlyOwner {
        require(_rate <= 2000, "Rate too high"); // Max 20%
        stakingRewardRate = _rate;
    }
    
    /**
     * @dev Vesting functionality
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 duration,
        bool revocable
    ) external onlyOwner notBlacklisted(beneficiary) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Vesting schedule already exists");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration,
            revocable: revocable,
            revoked: false
        });
        
        _transfer(msg.sender, address(this), amount);
        emit VestingScheduleCreated(beneficiary, amount, duration);
    }
    
    function releaseVestedTokens() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Vesting schedule revoked");
        
        uint256 vestedAmount = calculateVestedAmount(msg.sender);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        
        require(releasableAmount > 0, "No tokens to release");
        
        schedule.releasedAmount += releasableAmount;
        _transfer(address(this), msg.sender, releasableAmount);
        
        emit TokensVested(msg.sender, releasableAmount);
    }
    
    function calculateVestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0 || schedule.revoked) return 0;
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }
        
        uint256 elapsedTime = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * elapsedTime) / schedule.duration;
    }
    
    function revokeVesting(address beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(schedule.revocable, "Vesting schedule not revocable");
        require(!schedule.revoked, "Already revoked");
        
        uint256 vestedAmount = calculateVestedAmount(beneficiary);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        uint256 remainingAmount = schedule.totalAmount - vestedAmount;
        
        schedule.revoked = true;
        
        // Release vested tokens to beneficiary
        if (releasableAmount > 0) {
            _transfer(address(this), beneficiary, releasableAmount);
        }
        
        // Return remaining tokens to owner
        if (remainingAmount > 0) {
            _transfer(address(this), owner(), remainingAmount);
        }
        
        emit VestingRevoked(beneficiary);
    }
    
    /**
     * @dev Override transfer functions to include fees and restrictions
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
        notBlacklisted(from)
        notBlacklisted(to)
    {
        // Apply transfer fee (except for minting, burning, and internal transfers)
        if (from != address(0) && to != address(0) && 
            from != address(this) && to != address(this) &&
            transferFee > 0) {
            
            uint256 fee = (value * transferFee) / 10000;
            if (fee > 0) {
                super._update(from, feeCollector, fee);
                value -= fee;
            }
        }
        
        super._update(from, to, value);
    }
    
    /**
     * @dev Emergency functions
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    /**
     * @dev View functions
     */
    function getStakeInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 stakingDuration,
        uint256 pendingReward
    ) {
        StakeInfo storage userStake = stakes[user];
        stakedAmount = userStake.amount;
        stakingDuration = userStake.amount > 0 ? block.timestamp - userStake.startTime : 0;
        pendingReward = calculateStakingReward(user) + userStake.rewardDebt;
    }
    
    function getVestingInfo(address beneficiary) external view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 vestedAmount,
        uint256 releasableAmount,
        bool revoked
    ) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        totalAmount = schedule.totalAmount;
        releasedAmount = schedule.releasedAmount;
        vestedAmount = calculateVestedAmount(beneficiary);
        releasableAmount = vestedAmount > releasedAmount ? vestedAmount - releasedAmount : 0;
        revoked = schedule.revoked;
    }
} 