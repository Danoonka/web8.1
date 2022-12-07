const Router = require('express');
const User = require('../models/User');
const router = new Router();
const bcrypt = require('bcryptjs');
const{check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken')
const config = require('config')
const authMiddleware = require('../middleware/auth.middleware')


router.post('/registration', [
        check('email', "incorrect email").isEmail(),
        check('password', "Password should be longer then 3 and shorter then 12").isLength({min: 3, max: 12}),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()){
                return res.status(400).json({message: "Incorrect request", errors })
            }
            const {email, password, name, group, variant} = req.body
            const candidate = await User.findOne({email})
            if(candidate){
                return res.status(400).json({message: `User with email ${email} already exist`})
            }
            const hashPassword = await bcrypt.hash(password, 15)
            const user = new User({email, password: hashPassword, name, group, variant})
            await user.save();
            return res.json({message: "User was created" })

        }catch (e) {
            console.log(e);
            res.send({message: "Server error"})
        }
})

router.post('/login', async (req, res) => {
        try {
            const{email, password} = req.body;
            const user = await User.findOne({email})
            if(!user){
               return res.status(404).json({message: 'User undefined '})
            }
            const isPassValid = bcrypt.compareSync(password, user.password)
            if (!isPassValid){
                return res.status(400).json({message: "Unexpected login or password"})
            }
            const token = jwt.sign({id: user.id}, config.get("secretKey"), {expiresIn: "1h"} )
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    group: user.group,
                    variant: user.variant
                }
            })
        }catch (e) {
            console.log(e);
            res.send({message: "Server error"})
        }
    })

router.get('/auth', authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({id: req.user.id})
            const token = jwt.sign({id: user.id}, config.get("secretKey"), {expiresIn: "1h"} )
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    group: user.group,
                    variant: user.variant
                }
            })
        }catch (e) {
            console.log(e);
            res.send({message: "Server error"})
        }
    })
router.get('/profile', async (req, res) => {
    try {
        const{email, password} = req.body;
        console.log(req.body)
        const user = await User.findOne({email})
        console.log(user)
        if(!user){
            console.log("Доступ заборонено")
        }
        console.log( res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                group: user.group,
                variant: user.variant
            }
        }))

    }catch (e) {
        console.log(e);
    }
})


module.exports = router;