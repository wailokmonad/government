pragma solidity ^0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/access/AccessControl.sol";
import '@openzeppelin/contracts/security/Pausable.sol';
import "@openzeppelin/contracts/utils/Counters.sol";

contract Government is Ownable, Pausable, AccessControl{

    using Counters for Counters.Counter;

    uint public constant MAX_CHOICES = 15;

    uint public constant MAX_PROPOSAL = 10;

    uint public constant MAX_MEMBER = 100;

    mapping (address => bool) private _member;

    Counters.Counter private _numberOfMember;

    Proposal[] private _proposal;

    mapping ( uint => mapping (address => bool) ) private _isVoted;

    struct Proposal { 
        address proposer;
        string description;
        uint startTime;
        uint endTime;
        string[] choices;
        bool active;
        uint[] votes;
    }

    event ProposalAdded (uint256 indexed proposalId, address indexed proposer);

    event ProposalClosed (uint256 indexed proposalId);

    /**
    * @dev Restricted to members of the admin role.
    */
    modifier onlyAdmin() {
        require(isAdmin(_msgSender()), "Government::onlyAdmin: You are not the admin");
        _;
    }

    /**
    * @dev Check if the member is part of the community
    */
    modifier isPartOfCommunity(address _add) {
        require(_member[_add], "Government::isPartOfCommunity: You are not a part of the community");
        _;
    }

    /**
    * @dev Check if this is an existing proposal
    */
    modifier isProposer(uint _proposalId, address _add) {
        require( _proposal[_proposalId].proposer == _add, "Government::isProposer: You are not the proposer");
        _;
    }

    /**
    * @dev Check if this is a valid  proposal
    */
    modifier isValidProposal(uint _proposalId) {
        require( _proposalId >= 0 && _proposalId < _proposal.length , "Government::isValidProposal: The proposal doesn't exist");
        _;
    }

    /**
    * @dev Check if this is a valid choice on top of a given proposal
    */
    modifier isValidChoice(uint _proposalId, uint _choicesId) {
        require( _choicesId >= 0 && _choicesId < _proposal[_proposalId].choices.length, "Government::isValidChoice: The choice doesn't exist");
        _;
    }

    /**
    * @dev Check if this is a valid vote
    */
    modifier isValidVote(uint _proposalId, address _add) {
        require( _proposal[_proposalId].active, "Government::isValidVote: The proposal is not active now");
        require( _isVoted[_proposalId][_add] == false, "Government::isValidVote: Already voted on this proprosal");
        require(block.timestamp > _proposal[_proposalId].startTime, "Government::isValidVote: The proposal haven't started yet");
        require(block.timestamp < _proposal[_proposalId].endTime, "Government::isValidVote: The proposal have already ended");
        _;
    }

    constructor() {
        _setupRole( DEFAULT_ADMIN_ROLE, _msgSender() );
        _addMember(_msgSender());
    } 

    /**
     * @dev add proposal
     * @param _description the proposal name
     * @param _startTime the start time of the proposal
     * @param _endTime the start time of the proposal
     * @param _choices the array of choice to be voted on the proposal
     **/
    function addProposal( 
        string memory _description, 
        uint _startTime, 
        uint _endTime, 
        string[] memory _choices
    ) external isPartOfCommunity(_msgSender()) {

        require( bytes(_description).length > 0, "Government::addProposal: description cannot be empty");
        require( _choices.length >= 2, "Government::addProposal: Number of choices cannot be smaller than TWO");
        require(_choices.length <= MAX_CHOICES, "Government::addProposal: Number of choices cannot be larger than MAX_CHOICES");
        require( _startTime < _endTime, "Government::addProposal: startTime must be smaller than endTime");

        for ( uint i = 0; i < _choices.length; i++ ) {
            require(bytes(_choices[i]).length > 0, "Government::addProposal: choices cannot include empty string");
        }

        _proposal.push( Proposal({
            proposer: _msgSender(),
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            choices: _choices,
            active: true,
            votes: new uint[](_choices.length)
        }) );

        emit ProposalAdded( _proposal.length - 1, _msgSender() );

    }

    /**
     * @dev get the FULL proposal object
     * @param _id the proposal id
     **/
    function getProposal( uint _id ) 
        isValidProposal(_id)
        external virtual view returns ( Proposal memory ) 
    {
        return _proposal[_id];
    }

    /**
     * @dev batch get the FULL proposal object
     * @param _startId the starting position
     * @param _endId the ending position
     **/
    function batchGetProposal( uint _startId, uint _endId ) 
        isValidProposal(_startId)
        isValidProposal(_endId)
        external virtual view returns ( Proposal[] memory ) 
    {

        require( _endId > _startId, "Government::batchGetProposal: endId should be larger than startId");
        require( _endId - _startId + 1 <= MAX_PROPOSAL, "Government::batchGetProposal: Array too large");

        Proposal[] memory result = new Proposal[]( _endId - _startId + 1 );
        uint count = 0;

        for ( uint i = _startId; i < _endId + 1; i++ ) {
            result[count] = _proposal[i];
            count++;
        }

        return result;

    }

    /**
     * @dev close the proposal
     * @param _proposalId the proposal Id
     **/
    function closeProposal( uint _proposalId ) external onlyAdmin isValidProposal(_proposalId) {
        Proposal storage p = _proposal[ _proposalId ];
        p.active = false;
        emit ProposalClosed(_proposalId);
    }

    /**
     * @dev vote on a proposal
     * @param _proposalId the proposal Id
     * @param _choicesId the choice Id
     **/
    function vote( uint _proposalId, uint _choicesId ) external 
        whenNotPaused
        isPartOfCommunity( _msgSender() ) 
        isValidProposal(_proposalId)
        isValidVote( _proposalId, _msgSender() ) 
        isValidChoice( _proposalId, _choicesId ) 
    {

        Proposal storage p = _proposal[ _proposalId ];
        _isVoted[_proposalId][_msgSender()] = true;
        p.votes[_choicesId] = p.votes[_choicesId] + 1;

    }

    /**
     * @dev add member
     * @param _add the array of member address
     **/
    function addMember(address[] memory _add) external onlyAdmin {
        require(_add.length <= MAX_MEMBER, "Government::batchAddMember: Array size too large");
        for ( uint i = 0; i < _add.length; i++ ) {
            _addMember(_add[i]);
        }
    }

    /**
     * @dev remove member
     * @param _add the array of member address
     **/
    function removeMember(address[] memory _add) external onlyAdmin {
        require(_add.length <= MAX_MEMBER, "Government::batchRemoveMember: Array size too large");
        for ( uint i = 0; i < _add.length; i++ ) {
            _removeMember(_add[i]);
        }
    }

    /**
     * @dev add member
     * @param _add the array of member address
     **/
    function _addMember(address _add) internal {
        _member[_add] = true;
        _numberOfMember.increment();
    }

    /**
     * @dev remove member
     * @param _add the array of member address
     **/
    function _removeMember(address _add) internal {
        _member[_add] = false;
        _numberOfMember.decrement();
    }


    /**
     * @dev check if the address is a member or not
     * @param _add the array of member address
     **/
    function member(address _add) external virtual view returns (bool) {
        return _member[_add];
    }

    /**
     * @dev check if the address has voted on a given proposal or not
     * @param _id proposal Id
     * @param _add the array of member address
     **/
    function isVoted(uint _id, address _add) external virtual view returns (bool) {
        return _isVoted[_id][_add];
    }

    /**
     * @dev return the total number of proposal
     **/
    function numberOfProposals() external virtual view returns (uint) {
        return _proposal.length;
    }

    /**
     * @dev return the total number of member
     **/
    function numberOfMember() external virtual view returns (uint) {
        return _numberOfMember.current();
    }

    /**
    * @dev returns `true` if the account belongs to the admin role.
    * @param _account address from the account to check
    */  
    function isAdmin(address _account) public virtual view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _account);
    }

    /**
    * @dev Add an account to the admin role. Restricted to admins.
    * @param _account address from the account to add
    */  
    function addAdmin(address _account) external virtual onlyOwner {
        grantRole(DEFAULT_ADMIN_ROLE, _account);
        _addMember(_account);
    }

    /**
    * @dev Remove an account from the admin role. Restricted to admins.
    * @param _account address from the account to add
    */  
    function removeAdmin(address _account) external virtual onlyOwner {
        revokeRole(DEFAULT_ADMIN_ROLE, _account);
        _removeMember(_account);
    }

    /**
    * @dev Triggers stopped state.
    */
    function pause() external onlyOwner {
        _pause();
    }

    /**
    * @dev Returns to normal state.
    */
    function unpause() external onlyOwner {
        _unpause();
    }

}